import { MongoClient, ObjectId } from "mongodb";
import { config } from "./config.js";

let client;
export const db = {};

export async function connectDb(uri = config.mongoUri, name = config.mongoDb) {
  client = new MongoClient(uri);
  await client.connect();
  const d = client.db(name);
  db.users = d.collection("users");
  db.worlds = d.collection("worlds");
  await db.users.createIndex({ usernameLower: 1 }, { unique: true });
  await db.worlds.createIndex({ owner: 1 });
  await db.worlds.createIndex({ members: 1 });
  await db.worlds.createIndex({ "stats.coins": -1 });
  await db.worlds.createIndex({ "stats.level": -1 });
  await db.worlds.createIndex({ "stats.pop": -1 });
  return db;
}

export async function closeDb() {
  if (client) await client.close();
}

export function oid(id) {
  try {
    return new ObjectId(String(id));
  } catch {
    return null;
  }
}
