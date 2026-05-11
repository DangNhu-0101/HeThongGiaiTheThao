import Match from "../models/matchs.js";
import Team from "../models/teams.js";
import User from "../models/User.js";
import BaseRule from "../models/Rule/baseRules.js";
import { calculateMatchTimeline } from "../services/engine/timeCalculator.js";
import { smartSchedule } from "../services/engine/schedulerEngine.js";
import { generateKnockoutBracket } from "../services/engine/matchGenerator.js";
import { updateTeamRankings } from "../services/engine/rankingEngine.js";
import { autoAssignRefereesProcess } from "../services/engine/refereeEngine.js";

// ==========================================
// A. DÀNH CHO KHÁN GIẢ & TRỌNG TÀI
// ==========================================

export const getAllMatches = async (req, res) => {
    try {
        const matches = await Match.find({ isPublished: true })
            .populate("team1", "teamName group")
            .populate("team2", "teamName group")
            .populate("refereeId", "displayName")
            .sort({ timestart: 1 });

        const formattedMatches = matches.map(m => ({
            ...m._doc,
            team1Name: m.team1?.teamName || m.team1Name || "Đang chờ",
            team2Name: m.team2?.teamName || m.team2Name || "Đang chờ",
            refereeName: m.refereeId?.displayName || "Chưa phân công"
        }));

        return res.status(200).json({
            success: true,
            count: formattedMatches.length,
            data: formattedMatches,
        });
    } catch (error) {
        console.error("Lỗi lấy trận đấu công khai:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách trận đấu" });
    }
};

export const getMatchesForReferee = async (req, res) => {
    try {
        const currentRefereeId = req.user.id;
        const matches = await Match.find({
            refereeId: currentRefereeId,
            matchStatus: { $in: ["pending", "playing"] },
            isPublished: true 
        })
            .populate("team1", "teamName")
            .populate("team2", "teamName")
            .sort({ timestart: 1 });

        return res.status(200).json({ success: true, data: matches });
    } catch (error) {
        console.error("Lỗi lấy trận đấu cho trọng tài:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};

export const updateMatchScore = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { team1Score, team2Score } = req.body;

        const match = await Match.findById(matchId);
        if (!match) return res.status(404).json({ success: false, message: "Không tìm thấy trận đấu" });

        if (match.matchStatus === "finished") {
            return res.status(400).json({ success: false, message: "Trận đấu này đã kết thúc, không thể sửa điểm!" });
        }

        match.result = match.result || {};
        match.result.team1Score = team1Score;
        match.result.team2Score = team2Score;
        match.matchStatus = "finished";

        let winnerId = null;
        if (team1Score > team2Score) winnerId = match.team1;
        else if (team2Score > team1Score) winnerId = match.team2;
        match.winnerId = winnerId;

        await match.save();

        // GỌI RANKING ENGINE NẾU LÀ VÒNG BẢNG
        if (match.matchType === 'group' || match.stage === 'group') {
            const ruleInfo = await BaseRule.findById(match.ruleId);
            if(ruleInfo) {
                await updateTeamRankings(match, team1Score, team2Score, ruleInfo);
            }
        }

        return res.status(200).json({ success: true, message: "Cập nhật kết quả thành công!" });
    } catch (error) {
        console.error("Lỗi cập nhật điểm:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi lưu điểm" });
    }
};

// ==========================================
// B. DÀNH CHO ADMIN TỔ CHỨC GIẢI
// ==========================================

export const getDraftMatches = async (req, res) => {
    try {
        const matches = await Match.find({ isPublished: false })
            .populate("team1", "teamName")
            .populate("team2", "teamName")
            .sort({ timestart: 1 });
            
        return res.status(200).json({ success: true, data: matches });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};

export const getEditableMatches = async (req, res) => {
    try {
        const matches = await Match.find({ matchStatus: { $ne: "finished" } })
            .populate("team1", "teamName")
            .populate("team2", "teamName")
            .sort({ timestart: 1 });

        const formattedMatches = matches.map(m => ({
            ...m._doc,
            team1Name: m.team1?.teamName || m.team1Name || "Đang chờ",
            team2Name: m.team2?.teamName || m.team2Name || "Đang chờ"
        }));

        return res.status(200).json({ success: true, data: formattedMatches });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};

// ==========================================
// C. SMART ENGINE: BỐC THĂM VÒNG BẢNG
// ==========================================
export const autoDrawAndGenerateMatches = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { startTime, courts, ruleId } = req.body; 

        if (!ruleId) return res.status(400).json({ success: false, message: "Vui lòng chọn môn thi đấu (Luật) để bốc thăm!" });
        if (!courts || courts.length === 0) return res.status(400).json({ success: false, message: "Cần ít nhất 1 sân rảnh để bốc thăm!" });

        const ruleInfo = await BaseRule.findById(ruleId);
        if (!ruleInfo) return res.status(404).json({ success: false, message: "Không tìm thấy bộ luật!" });

        const validTeams = await Team.find({ 
            tournamentId: tournamentId, 
            ruleId: ruleId, 
            status: "validated", 
            isPaid: true 
        }).populate("members");

        if (validTeams.length < 3) {
            return res.status(400).json({ success: false, message: `Cần tối thiểu 3 đội để tổ chức bảng đấu môn ${ruleInfo.sportType}!` });
        }

        // 1. Chia bảng Ziczac theo kỹ năng
        const teamScores = validTeams.map(team => {
            const totalSkill = team.members.reduce((sum, p) => sum + (p.skillLevel || 2.0), 0);
            return { team, totalSkill };
        }).sort((a, b) => b.totalSkill - a.totalSkill);

        const groupCount = Math.max(2, Math.ceil(validTeams.length / 4));
        const groups = Array.from({length: groupCount}, (_, i) => String.fromCharCode("A".charCodeAt(0) + i));
        const groupData = {}; groups.forEach(g => groupData[g] = []);
        
        teamScores.forEach((t, i) => {
            const groupIndex = Math.floor(i / groupCount) % 2 === 0 
                ? i % groupCount 
                : (groupCount - 1) - (i % groupCount);
            
            const groupName = groups[groupIndex];
            groupData[groupName].push(t);
            t.team.group = groupName;
            t.team.save(); 
        });

        // 2. TẠO CÁC CẶP ĐẤU THÔ (RAW MATCHES) - THUẬT TOÁN ROUND-ROBIN
        const rawMatches = [];
        for (const [groupName, teamsInGroup] of Object.entries(groupData)) {
            const teams = [...teamsInGroup];
            if (teams.length % 2 !== 0) teams.push(null); // Bye
            
            const numRounds = teams.length - 1;
            for (let round = 0; round < numRounds; round++) {
                for (let i = 0; i < teams.length / 2; i++) {
                    const tA = teams[i];
                    const tB = teams[teams.length - 1 - i];
                    
                    if (tA && tB) {
                        rawMatches.push({
                            tournamentId: tournamentId,
                            ruleId: ruleInfo._id, 
                            onModel: ruleInfo.__t || 'BaseRule',
                            sportType: ruleInfo.sportType, 
                            group: groupName,
                            matchType: "group",
                            stage: "group",
                            team1: tA.team._id,
                            team1Name: tA.team.teamName, 
                            team2: tB.team._id,
                            team2Name: tB.team.teamName, 
                            matchStatus: "pending",
                            isPublished: false
                        });
                    }
                }
                teams.splice(1, 0, teams.pop()); 
            }
        }

        // 3. GỌI SCHEDULER ENGINE ĐỂ XẾP LỊCH, GÁN SÂN VÀ GIỜ
        const { durationMs, restTimeMs } = calculateMatchTimeline(ruleInfo);
        const startMs = startTime ? new Date(startTime).getTime() : Date.now();

        const scheduledMatches = smartSchedule(rawMatches, courts, startMs, durationMs, restTimeMs);

        return res.status(200).json({
            success: true,
            message: "Tạo lịch vòng bảng nháp thành công!",
            data: scheduledMatches 
        });

    } catch (error) {
        console.error("Lỗi Auto Draw:", error); 
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi bốc thăm" });
    }
};

// ==========================================
// D. SMART ENGINE: KNOCKOUT & TRỌNG TÀI
// ==========================================

export const generateKnockout = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { startTime, courts, ruleId } = req.body; 

        if (!ruleId || !courts || courts.length === 0) 
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu môn thi hoặc sân!" });

        const ruleInfo = await BaseRule.findById(ruleId);
        if(!ruleInfo) return res.status(404).json({ success: false, message: "Luật không tồn tại" });

        const teams = await Team.find({ tournamentId: tournamentId, ruleId: ruleId });
        const groups = [...new Set(teams.map(t => t.group).filter(Boolean))].sort();
        
        if (groups.length === 0) return res.status(400).json({ success: false, message: "Chưa có bảng đấu nào để tạo Knockout!" });

        // GỌI ENGINE SINH BRACKET & XẾP LỊCH
        const { durationMs, restTimeMs } = calculateMatchTimeline(ruleInfo);
        const startMs = startTime ? new Date(startTime).getTime() : Date.now() + 24*60*60*1000;
        
        const rawKnockoutMatches = generateKnockoutBracket(teams, groups, ruleInfo, tournamentId);
        const scheduledKnockout = smartSchedule(rawKnockoutMatches, courts, startMs, durationMs, restTimeMs);

        return res.status(200).json({ success: true, data: scheduledKnockout });
    } catch (error) {
        console.error("Lỗi tạo Knockout:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};

export const autoAssignReferees = async (req, res) => {
    try {
        const { ruleId } = req.body;
        if(!ruleId) return res.status(400).json({ success: false, message: "Vui lòng truyền ruleId!" });

        const referees = await User.find({ role: 'Referee' }).select('_id displayName');
        if (!referees || referees.length === 0) {
            return res.status(400).json({ success: false, message: "Không có trọng tài!" });
        }

        const matches = await Match.find({ isPublished: false, ruleId: ruleId, matchStatus: { $ne: "finished" } }).sort({ timestart: 1 });
        if (matches.length === 0) return res.status(400).json({ success: false, message: "Không có trận nháp nào cần phân công!" });

        const ruleInfo = await BaseRule.findById(ruleId);
        const { durationMs } = calculateMatchTimeline(ruleInfo);

        // GỌI REFEREE ENGINE
        const assignedCount = await autoAssignRefereesProcess(matches, referees, durationMs);

        return res.status(200).json({ 
            success: true,
            message: "Tự động phân công trọng tài thành công!",
            assignedMatches: assignedCount
        });
    } catch (error) {
        console.error("Lỗi AI phân trọng tài:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};

export const saveManualReferees = async (req, res) => {
    try {
        const { matches } = req.body;
        const updatePromises = matches.map(m => {
            return Match.findByIdAndUpdate(m._id, { refereeId: m.refereeId || null });
        });
        await Promise.all(updatePromises);
        return res.status(200).json({ success: true, message: "Đã lưu phân công thủ công!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};

export const publishMatches = async (req, res) => {
    try {
        const { matches } = req.body; 
        const bulkOps = matches.map(m => {
            if (m._id) {
                return {
                    updateOne: {
                        filter: { _id: m._id },
                        update: { 
                            $set: { 
                                timestart: m.timestart, 
                                court: m.court, 
                                refereeId: m.refereeId,
                                isPublished: true 
                            } 
                        }
                    }
                };
            } else {
                return {
                    insertOne: {
                        document: {
                            tournamentId: m.tournamentId,
                            ruleId: m.ruleId,
                            sportType: m.sportType,
                            onModel: m.onModel || 'BaseRule',
                            matchName: m.matchName || `Bảng ${m.group}`,
                            matchType: m.matchType || "group",
                            stage: m.stage || "group",
                            group: m.group,
                            team1: m.team1 || null, 
                            team2: m.team2 || null, 
                            team1Name: m.team1Name, 
                            team2Name: m.team2Name, 
                            court: m.court,
                            timestart: m.timestart,
                            matchStatus: "pending",
                            isPublished: true
                        }
                    }
                };
            }
        });

        if (bulkOps.length > 0) await Match.bulkWrite(bulkOps);

        return res.status(200).json({ success: true, message: "Công khai lịch thi đấu thành công!" });
    } catch (error) {
        console.error("Lỗi duyệt lịch:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};