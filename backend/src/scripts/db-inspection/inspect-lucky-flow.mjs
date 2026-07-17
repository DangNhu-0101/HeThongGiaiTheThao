import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config({ path: ".env" });

const uri = process.env.CODEX_MONGODB_URI;
const databaseName = process.env.CODEX_MONGODB_DB;

if (!uri || !databaseName) {
  throw new Error("Missing read-only MongoDB inspection configuration");
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });

const id = (value) => String(value || "");

async function main() {
  try {
    await client.connect();
    const db = client.db(databaseName);
    const matches = await db.collection("matches").find({
      $or: [
        { name: { $in: ["M1", "M13", "M14", "M15", "M16", "M17", "M18"] } },
        { formatSlotLabels: { $regex: "^Lucky\\d+$", $options: "i" } },
      ],
    }, {
      projection: {
        tournamentItemId: 1,
        stageId: 1,
        name: 1,
        formatNodeId: 1,
        status: 1,
        participants: 1,
        winnerParticipantId: 1,
        formatSlotLabels: 1,
        slotSources: 1,
        previousMatches: 1,
      },
    }).toArray();

    const tournamentCounts = new Map();
    matches.forEach((match) => {
      const key = id(match.tournamentItemId);
      const luckyWeight = (match.formatSlotLabels || []).some((label) => /^Lucky\d+$/i.test(String(label))) ? 100 : 1;
      tournamentCounts.set(key, (tournamentCounts.get(key) || 0) + luckyWeight);
    });
    const tournamentItemId = [...tournamentCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!tournamentItemId) {
      console.log("No matching tournament item found.");
      return;
    }

    const selectedMatches = matches.filter((match) => id(match.tournamentItemId) === tournamentItemId);
    const participantIds = [...new Set(selectedMatches.flatMap((match) => [
      ...(match.participants || []).map(id),
      id(match.winnerParticipantId),
    ]).filter(Boolean))];
    const participants = await db.collection("participants").find(
      { _id: { $in: participantIds.map((value) => new ObjectId(value)) } },
      { projection: { name: 1 } },
    ).toArray();
    const participantNames = new Map(participants.map((participant) => [id(participant._id), participant.name]));
    const matchResults = await db.collection("matchresults").find(
      { matchId: { $in: selectedMatches.map((match) => match._id) } },
      { projection: { matchId: 1, winnerParticipantId: 1, winnerScore: 1, loserScore: 1, status: 1 } },
    ).toArray();
    const resultByMatch = new Map(matchResults.map((result) => [id(result.matchId), result]));
    const tournamentItem = await db.collection("tournamentitems").findOne(
      { _id: selectedMatches[0].tournamentItemId },
      { projection: { "competitionFormat.config.stages": 1 } },
    );

    console.log(`Tournament item: ${tournamentItemId}`);
    console.table(selectedMatches.sort((a, b) => Number(a.name.slice(1)) - Number(b.name.slice(1))).map((match) => {
      const result = resultByMatch.get(id(match._id));
      return {
        match: match.name,
        node: match.formatNodeId,
        status: match.status,
        labels: JSON.stringify(match.formatSlotLabels || []),
        participants: JSON.stringify((match.participants || []).map((participantId) => participantNames.get(id(participantId)) || id(participantId))),
        matchWinner: participantNames.get(id(match.winnerParticipantId)) || id(match.winnerParticipantId),
        resultWinner: participantNames.get(id(result?.winnerParticipantId)) || id(result?.winnerParticipantId),
        resultStatus: result?.status || "",
      };
    }));

    const stages = tournamentItem?.competitionFormat?.config?.stages || [];
    console.log("Configured wildcard stages:");
    console.dir(stages.filter((stage) => stage?.wildcard?.enabled).map((stage) => ({
      id: stage.id,
      order: stage.order,
      slots: stage.wildcard?.slots || stage.wildcard?.selection?.slots,
      criteria: stage.wildcard?.criteria || stage.luckyCriteria,
      branches: (stage.brackets || []).map((branch) => ({
        id: branch.id,
        flowSlots: (branch.flowSlots || []).map((slot) => ({ id: slot.id, matchId: slot.matchId, sourceLabel: slot.sourceLabel })),
        defaultMatches: branch.defaultMatches || [],
      })),
    })), { depth: 5 });

    console.log("Target stage seed assignments:");
    console.dir(stages.filter((stage) => stage?.wildcard?.enabled).map((stage) => ({
      stageId: stage.id,
      assignments: (stage.seedAssignments || []).map((assignment) => ({
        participantId: id(assignment.participantId),
        sourceKey: assignment.sourceKey || assignment.sourceLabel || "",
        slotId: assignment.slotId || "",
      })),
    })), { depth: 5 });

    const targetStage = stages.find((stage) => stage?.wildcard?.enabled);
    if (targetStage) {
      const sourceOrders = stages.filter((stage) => Number(stage.order) < Number(targetStage.order)).map((stage) => Number(stage.order));
      const targetOrder = Number(targetStage.order);
      const stageRules = await db.collection("stagerules").find(
        { tournamentItemId: selectedMatches[0].tournamentItemId, number: { $in: [...sourceOrders, targetOrder] } },
        { projection: { name: 1, number: 1 } },
      ).toArray();
      const sourceRuleIds = stageRules.filter((stage) => sourceOrders.includes(Number(stage.number))).map((stage) => stage._id);
      const targetRuleId = stageRules.find((stage) => Number(stage.number) === targetOrder)?._id;
      const sourceRows = await db.collection("matches").find(
        { tournamentItemId: selectedMatches[0].tournamentItemId, stageId: { $in: sourceRuleIds } },
        { projection: { _id: 1, name: 1, stageId: 1, status: 1, participants: 1, winnerParticipantId: 1 } },
      ).toArray();
      const sourceResults = await db.collection("matchresults").find(
        { matchId: { $in: sourceRows.map((match) => match._id) } },
        { projection: { matchId: 1, status: 1, winnerParticipantId: 1, winnerScore: 1, loserScore: 1, isDraw: 1 } },
      ).toArray();
      const targetRows = targetRuleId ? await db.collection("matches").find(
        { tournamentItemId: selectedMatches[0].tournamentItemId, stageId: targetRuleId },
        { projection: { name: 1, status: 1, scheduleStatus: 1, scheduledTime: 1, formatSlotLabels: 1 } },
      ).toArray() : [];
      const sourceById = new Map(sourceRows.map((match) => [id(match._id), match]));
      const sourceByCode = new Map(sourceRows.map((match) => [String(match.name || "").toUpperCase(), match]));
      const officialIds = new Set();
      targetRows.flatMap((match) => match.formatSlotLabels || []).forEach((label) => {
        const key = String(label || "").toUpperCase();
        const source = sourceByCode.get(key);
        if (source?.winnerParticipantId) officialIds.add(id(source.winnerParticipantId));
      });
      const officialParticipants = await db.collection("participants").find(
        { _id: { $in: [...officialIds].map((value) => new ObjectId(value)) } },
        { projection: { name: 1 } },
      ).toArray();
      console.log("Official teams derived from target match keys:", officialParticipants.map((participant) => participant.name).sort());
      const eliminatedIds = new Set();
      sourceResults.filter((result) => result.status === "confirmed").forEach((result) => {
        const source = sourceById.get(id(result.matchId));
        const winnerId = id(result.winnerParticipantId);
        (source?.participants || []).map(id).filter(Boolean).forEach((participantId) => {
          if (participantId !== winnerId && !officialIds.has(participantId)) eliminatedIds.add(participantId);
        });
      });
      const candidateParticipants = await db.collection("participants").find(
        { _id: { $in: [...eliminatedIds].map((value) => new ObjectId(value)) } },
        { projection: { name: 1 } },
      ).toArray();
      const candidateNames = new Map(candidateParticipants.map((participant) => [id(participant._id), participant.name]));
      const standings = await db.collection("standings").find(
        { tournamentItemId: selectedMatches[0].tournamentItemId, stageId: { $in: sourceRuleIds }, teamOrPlayerId: { $in: [...eliminatedIds].map((value) => new ObjectId(value)) } },
        { projection: { teamOrPlayerId: 1, stageId: 1, played: 1, wins: 1, draws: 1, losses: 1, goalsFor: 1, goalsAgainst: 1, goalDifference: 1, points: 1 } },
      ).toArray();
      const rankingRows = new Map([...eliminatedIds].map((teamId) => [teamId, {
        teamId,
        name: candidateNames.get(teamId) || teamId,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        pointDiff: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        standingStageIds: new Set(),
      }]));
      standings.forEach((standing) => {
        const row = rankingRows.get(id(standing.teamOrPlayerId));
        if (!row) return;
        row.played += Number(standing.played || 0);
        row.wins += Number(standing.wins || 0);
        row.losses += Number(standing.losses || 0);
        row.points += Number(standing.points || 0);
        row.pointDiff += Number(standing.goalDifference || 0);
        row.pointsFor += Number(standing.goalsFor || 0);
        row.pointsAgainst += Number(standing.goalsAgainst || 0);
        row.standingStageIds.add(id(standing.stageId));
      });
      sourceResults.filter((result) => result.status === "confirmed" && !result.isDraw).forEach((result) => {
        const source = sourceById.get(id(result.matchId));
        const winnerId = id(result.winnerParticipantId);
        const loserId = (source?.participants || []).map(id).find((participantId) => participantId && participantId !== winnerId);
        const row = rankingRows.get(loserId);
        if (!row || row.standingStageIds.has(id(source.stageId))) return;
        row.played += 1;
        row.losses += 1;
        row.pointsFor += Number(result.loserScore || 0);
        row.pointsAgainst += Number(result.winnerScore || 0);
        row.pointDiff += Number(result.loserScore || 0) - Number(result.winnerScore || 0);
      });
      const drawRank = (teamId) => {
        const value = `${targetStage.id}:${teamId}`;
        let hash = 0;
        for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash) + value.charCodeAt(index);
        return Math.abs(hash) + 1;
      };
      const rankedCandidates = [...rankingRows.values()].map((row) => ({ ...row, draw: drawRank(row.teamId) }))
        .sort((left, right) => right.points - left.points || right.pointDiff - left.pointDiff || left.draw - right.draw || left.name.localeCompare(right.name, "vi"));
      console.log("Wildcard top 4 by Points -> Point difference -> Draw:");
      console.table(rankedCandidates.slice(0, 4).map((row, index) => ({
        key: `Lucky${index + 1}`,
        team: row.name,
        played: row.played,
        wins: row.wins,
        losses: row.losses,
        points: row.points,
        pointDiff: row.pointDiff,
        draw: row.draw,
      })));
      console.log("Wildcard readiness:", {
        sourceMatches: sourceRows.length,
        sourceCompleted: sourceRows.filter((match) => ["completed", "walkover", "forfeited"].includes(match.status)).length,
        sourceConfirmedResults: sourceResults.filter((result) => result.status === "confirmed").length,
        officialQualifiersFromMatchKeys: officialIds.size,
        eliminatedCandidates: eliminatedIds.size,
        targetStatuses: targetRows.map((match) => ({ match: match.name, status: match.status, scheduleStatus: match.scheduleStatus, scheduledTime: match.scheduledTime })),
      });
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
