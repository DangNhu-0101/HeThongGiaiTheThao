import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env" });

const uri = process.env.CODEX_MONGODB_URI;

const databaseName = process.env.CODEX_MONGODB_DB;

if (!uri) {
  throw new Error("Thiếu CODEX_MONGODB_URI trong file .env");
}

if (!databaseName) {
  throw new Error("Thiếu CODEX_MONGODB_DB trong file .env");
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10_000,
});

async function inspectDatabase() {
  try {
    await client.connect();

    const db = client.db(databaseName);

    await db.command({ ping: 1 });
    console.log(`Đã kết nối database: ${databaseName}`);

    const collections = await db
      .listCollections({}, { nameOnly: true })
      .toArray();

    console.log("\nDanh sách collection:");

    console.table(
      collections.map((collection) => ({
        collection: collection.name,
      })),
    );

    console.log("\nSố document trong từng collection:");

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();

      console.log(`${collection.name}: ${count}`);
    }
  } catch (error) {
    console.error("Không thể đọc MongoDB:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

inspectDatabase();