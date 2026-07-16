import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env" });

const uri = process.env.CODEX_MONGODB_URI;
const databaseName = process.env.CODEX_MONGODB_DB;

if (!uri) {
  throw new Error("Missing CODEX_MONGODB_URI in .env");
}

if (!databaseName) {
  throw new Error("Missing CODEX_MONGODB_DB in .env");
}

const expectedCollectionsFromModels = [
  "brackets",
  "categoryrules",
  "categorytemplates",
  "contactmessages",
  "courts",
  "faultsandpenalties",
  "gamerules",
  "groups",
  "invitations",
  "knockoutresults",
  "matches",
  "matchresults",
  "news",
  "notifications",
  "organizations",
  "participants",
  "passwordresettokens",
  "players",
  "referees",
  "resourcemanagementrules",
  "roles",
  "scoringrules",
  "sessions",
  "sponsors",
  "stagetemplates",
  "stagerules",
  "standings",
  "systemsettings",
  "teamjoinrequests",
  "timemanagementrules",
  "tournamentitems",
  "tournamentreferees",
  "tournaments",
  "tournamenttemplates",
  "users",
];

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10_000,
});

async function main() {
  try {
    await client.connect();
    const db = client.db(databaseName);
    await db.command({ ping: 1 });

    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const collectionNames = collections.map((collection) => collection.name).sort();
    const expectedSet = new Set(expectedCollectionsFromModels);
    const unexpectedCollections = collectionNames.filter((name) => !expectedSet.has(name));
    const missingExpectedCollections = expectedCollectionsFromModels.filter(
      (name) => !collectionNames.includes(name),
    );

    const participantTypeCounts = await db
      .collection("participants")
      .aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
      .toArray();

    const roleRows = await db
      .collection("roles")
      .aggregate([{ $project: { _id: 1, name: 1 } }, { $sort: { name: 1 } }])
      .toArray();

    const adminRoleIds = roleRows
      .filter((role) => role.name === "admin")
      .map((role) => role._id);

    const adminUserCount = adminRoleIds.length
      ? await db.collection("users").countDocuments({ roles: { $in: adminRoleIds } })
      : 0;

    const emptyCollections = [];
    for (const name of collectionNames) {
      const count = await db.collection(name).countDocuments();
      if (count === 0) emptyCollections.push(name);
    }

    console.log(`Database: ${databaseName}`);
    console.log("\nParticipant counts by type:");
    console.table(participantTypeCounts.map((row) => ({ type: row._id, count: row.count })));

    console.log("\nRole names:");
    console.table(roleRows.map((role) => ({ name: role.name })));

    console.log(`\nUsers with admin role: ${adminUserCount}`);

    console.log("\nCollections present but not matched to current Mongoose model names:");
    console.table(unexpectedCollections.map((collection) => ({ collection })));

    console.log("\nExpected model collections missing from database:");
    console.table(missingExpectedCollections.map((collection) => ({ collection })));

    console.log("\nEmpty collections:");
    console.table(emptyCollections.map((collection) => ({ collection })));
  } catch (error) {
    console.error("Read-only MongoDB audit failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
