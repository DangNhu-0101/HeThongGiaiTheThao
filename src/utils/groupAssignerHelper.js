// utils/groupAssigner.js
import Team from '../models/teams.js';
import Member from '../models/membersOfTeam.js';


export const getTeamAvgSkill = async (teamId) => {
    const members = await Member.find({ teamId, status: 'Active' }).populate('userId', 'skillLevel');
    if (!members.length) return 0;
    const total = members.reduce((sum, m) => sum + (m.userId?.skillLevel || 0), 0);
    return total / members.length;
};


export const assignTeamsToGroups = async (teamIds, numGroups, method = 'random') => {
    if (!teamIds.length || numGroups <= 0) return [];
    let sortedTeams = [...teamIds];
    if (method === 'skill') {
        const withSkill = await Promise.all(teamIds.map(async (id) => ({
            id,
            skill: await getTeamAvgSkill(id)
        })));
        withSkill.sort((a, b) => b.skill - a.skill);
        sortedTeams = withSkill.map(t => t.id);
    } else if (method === 'snake') {
        const withSkill = await Promise.all(teamIds.map(async (id) => ({
            id,
            skill: await getTeamAvgSkill(id)
        })));
        withSkill.sort((a, b) => b.skill - a.skill);
        sortedTeams = withSkill.map(t => t.id);
    } else { // random
        for (let i = sortedTeams.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sortedTeams[i], sortedTeams[j]] = [sortedTeams[j], sortedTeams[i]];
        }
    }

    const groups = Array.from({ length: numGroups }, () => []);
    if (method === 'snake') {
        for (let i = 0; i < sortedTeams.length; i++) {
            const round = Math.floor(i / numGroups);
            let groupIdx = i % numGroups;
            if (round % 2 === 1) groupIdx = numGroups - 1 - groupIdx;
            groups[groupIdx].push(sortedTeams[i]);
        }
    } else {
        for (let i = 0; i < sortedTeams.length; i++) {
            groups[i % numGroups].push(sortedTeams[i]);
        }
    }
    return groups;
};