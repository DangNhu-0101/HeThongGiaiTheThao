import dotenv from "dotenv";
import mongoose from "mongoose";
import Match from "../../models/matches.js";
import "../../models/participants.js";
import "../../models/groups.js";
import "../../models/rules/brackets.js";
import "../../models/rules/stageRules.js";
import "../../models/courts.js";
import "../../models/tournamentReferees.js";
import "../../models/matchResults.js";

dotenv.config({ path: ".env" });

const uri = process.env.CODEX_MONGODB_URI;
const databaseName = process.env.CODEX_MONGODB_DB;
if (!uri || !databaseName) throw new Error("Missing read-only MongoDB inspection configuration");

async function main() {
  try {
    await mongoose.connect(uri, { dbName: databaseName, serverSelectionTimeoutMS: 10_000 });
    const tournamentItemId = "6a44b9135bdb3aec30642a11";
    const matches = await Match.find({ tournamentItemId })
      .populate('winnerParticipantId', 'name logo')
      .populate({ path: 'participants', select: 'name logo', retainNullValues: true })
      .populate('groupId', 'name')
      .populate('bracketId', 'name type')
      .populate('stageId', 'name number')
      .populate('courtId', 'name status')
      .populate('refereeIds', 'name qualification experience status')
      .populate('matchResultId')
      .populate({
        path: 'previousMatches.matchId',
        select: 'name formatNodeId winnerParticipantId status',
        populate: { path: 'winnerParticipantId', select: 'name logo' },
      })
      .sort({ round: 1, 'previousMatches.matchId': 1 });
    console.log({
      tournamentItemId,
      matchCount: matches.length,
      firstMatch: matches[0]?.name || "",
      sparseMatch: matches.find((match) => (match.formatSlotLabels || []).some((label) => /^Lucky\d+$/i.test(label)))?.participants || [],
    });
  } catch (error) {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
