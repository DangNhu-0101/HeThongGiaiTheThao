import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env" });

const uri = process.env.CODEX_MONGODB_URI;
const databaseName = process.env.CODEX_MONGODB_DB;
if (!uri || !databaseName) throw new Error("Missing read-only MongoDB inspection configuration");

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
const key = (value) => String(value || "");

async function groupedCount(db, collection, idField) {
  const rows = await db.collection(collection).aggregate([
    { $group: { _id: `$${idField}`, count: { $sum: 1 } } },
  ]).toArray();
  return new Map(rows.map((row) => [key(row._id), row.count]));
}

async function main() {
  try {
    await client.connect();
    const db = client.db(databaseName);
    const [items, matchCounts, participantCounts, stageCounts] = await Promise.all([
      db.collection("tournamentitems").find({}, {
        projection: {
          name: 1,
          tournamentId: 1,
          "competitionFormat.config.stages": 1,
        },
      }).toArray(),
      groupedCount(db, "matches", "tournamentItemId"),
      groupedCount(db, "participants", "tournamentItemId"),
      groupedCount(db, "stagerules", "tournamentItemId"),
    ]);

    console.table(items.map((item) => {
      const stages = item.competitionFormat?.config?.stages || [];
      const assignedTeamIds = new Set(stages.flatMap((stage) => [
        ...(stage.seedAssignments || []).map((assignment) => key(assignment.participantId)),
        ...((stage.brackets || []).flatMap((branch) => [
          ...(branch.selection?.manualTeamIds || []).map(key),
          ...((branch.groups || []).flatMap((group) => (group.teamIds || group.manualTeamIds || []).map(key))),
        ])),
      ]).filter(Boolean));
      return {
        tournamentItemId: key(item._id),
        tournamentId: key(item.tournamentId),
        name: item.name || "",
        configuredStages: stages.length,
        assignedTeams: assignedTeamIds.size,
        participants: participantCounts.get(key(item._id)) || 0,
        stageRules: stageCounts.get(key(item._id)) || 0,
        matches: matchCounts.get(key(item._id)) || 0,
      };
    }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
