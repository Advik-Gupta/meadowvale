import zlib from "node:zlib";
import { Binary } from "mongodb";
import { db, oid } from "./db.js";

export const canPlay = (user, w) => !!w && (w.owner.equals(user._id) || (w.members || []).some((m) => m.equals(user._id)));
export const canSpectate = (user, w) => canPlay(user, w) || (!!w && (user.friends || []).some((f) => f.equals(w.owner)));

export function packSave(saveText) {
  return new Binary(zlib.gzipSync(Buffer.from(saveText, "utf8")));
}
export function unpackSave(w) {
  if (!w || !w.saveZ) return null;
  const buf = w.saveZ.buffer ? Buffer.from(w.saveZ.buffer) : Buffer.from(w.saveZ);
  return zlib.gunzipSync(buf).toString("utf8");
}
export function cleanStats(s) {
  const n = (v) => (Number.isFinite(+v) ? Math.max(0, Math.round(+v)) : 0);
  s = s || {};
  return { level: n(s.level), coins: n(s.coins), pop: n(s.pop), cities: n(s.cities), buildings: n(s.buildings) };
}
export async function storeSave(worldId, saveText, stats) {
  if (typeof saveText !== "string" || saveText.length > 40e6) throw new Error("Save is too large.");
  JSON.parse(saveText);
  const set = { saveZ: packSave(saveText), saveSize: saveText.length, updatedAt: new Date() };
  if (stats) set.stats = cleanStats(stats);
  const _id = typeof worldId === "string" ? oid(worldId) : worldId;
  const r = await db.worlds.updateOne({ _id }, { $set: set, $inc: { version: 1 } });
  if (!r.matchedCount) throw new Error("World not found.");
}
export async function loadWorld(id) {
  const _id = oid(id);
  return _id ? db.worlds.findOne({ _id }) : null;
}
