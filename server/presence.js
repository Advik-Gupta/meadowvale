import { db } from "./db.js";

const ACTIVE_MS = 100000;
const seen = new Map();
const stored = new Map();

export function touch(userId) {
  const id = String(userId),
    now = Date.now();
  seen.set(id, now);
  if (now - (stored.get(id) || 0) > 5 * 60000 && db.users) {
    stored.set(id, now);
    db.users.updateOne({ _id: db.oid(id) }, { $set: { lastSeen: new Date(now) } }).catch(() => {});
  }
}
export function lastSeen(user) {
  const mem = seen.get(String(user._id));
  const saved = user.lastSeen ? +new Date(user.lastSeen) : 0;
  return Math.max(mem || 0, saved) || null;
}
export function recentlyActive(userId) {
  return Date.now() - (seen.get(String(userId)) || 0) < ACTIVE_MS;
}
