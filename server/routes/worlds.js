import { Router } from "express";
import { db, oid } from "../db.js";
import { requireUser } from "../auth.js";
import { canPlay, canSpectate, storeSave, unpackSave, loadWorld, cleanStats } from "../worlds.js";
import { roomInfo, kickFromWorld } from "../realtime.js";

const router = Router();
router.use(requireUser);

const META = { saveZ: 0 };
async function usernames(idList) {
  const users = await db.users.find({ _id: { $in: idList } }, { projection: { username: 1 } }).toArray();
  return Object.fromEntries(users.map((u) => [String(u._id), u.username]));
}
async function describe(worlds) {
  const people = new Set();
  for (const w of worlds) { people.add(String(w.owner)); for (const m of w.members || []) people.add(String(m)); }
  const names = await usernames([...people].map(oid));
  return worlds.map((w) => ({
    id: String(w._id), name: w.name, seed: w.seed, mode: w.mode, type: w.type,
    owner: { id: String(w.owner), username: names[String(w.owner)] || "?" },
    members: (w.members || []).map((m) => ({ id: String(m), username: names[String(m)] || "?" })),
    stats: w.stats || {}, version: w.version || 0, updatedAt: w.updatedAt, createdAt: w.createdAt,
    hasSave: !!w.saveSize, live: roomInfo(String(w._id)),
  }));
}

router.get("/", async (req, res) => {
  const me = req.user._id;
  const mine = await db.worlds.find({ owner: me }, { projection: META }).sort({ updatedAt: -1 }).toArray();
  const shared = await db.worlds.find({ members: me }, { projection: META }).sort({ updatedAt: -1 }).toArray();
  const friends = (req.user.friends || []).length ? await db.worlds.find({ owner: { $in: req.user.friends }, members: { $ne: me } }, { projection: META }).sort({ updatedAt: -1 }).limit(60).toArray() : [];
  res.json({ mine: await describe(mine), shared: await describe(shared), friends: await describe(friends) });
});

router.post("/", async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || "New World").slice(0, 32).trim() || "New World";
  const friendIds = new Set((req.user.friends || []).map(String));
  const members = (Array.isArray(b.members) ? b.members : []).map(String).filter((id) => friendIds.has(id)).map(oid);
  const w = {
    owner: req.user._id, name, seed: String(b.seed || "").slice(0, 40), mode: b.mode === "creative" ? "creative" : "career",
    type: ["normal", "archipelago", "pangaea", "islands"].includes(b.type) ? b.type : "normal",
    members, stats: cleanStats(b.stats), version: 0, saveSize: 0, createdAt: new Date(), updatedAt: new Date(),
  };
  if (!(typeof b.save === "string" && b.save.length)) {
    const dup = await db.worlds.findOne({ owner: req.user._id, name, saveSize: 0, createdAt: { $gt: new Date(Date.now() - 60000) } }, { projection: META });
    if (dup) return res.json({ world: (await describe([dup]))[0] });
  }
  const r = await db.worlds.insertOne(w);
  w._id = r.insertedId;
  if (typeof b.save === "string" && b.save.length) await storeSave(w._id, b.save, b.stats);
  res.json({ world: (await describe([await db.worlds.findOne({ _id: w._id }, { projection: META })]))[0] });
});

router.get("/:id", async (req, res) => {
  const w = await loadWorld(req.params.id);
  if (!w || !canSpectate(req.user, w)) return res.status(404).json({ error: "World not found." });
  const [meta] = await describe([w]);
  res.json({ world: meta, role: canPlay(req.user, w) ? "player" : "spectator", save: unpackSave(w) });
});

router.put("/:id/save", async (req, res) => {
  const w = await loadWorld(req.params.id);
  if (!w || !canPlay(req.user, w)) return res.status(404).json({ error: "World not found." });
  await storeSave(w._id, (req.body || {}).save, (req.body || {}).stats);
  res.json({ ok: true });
});

router.patch("/:id", async (req, res) => {
  const w = await loadWorld(req.params.id);
  if (!w || !w.owner.equals(req.user._id)) return res.status(404).json({ error: "World not found." });
  const name = String((req.body || {}).name || "").slice(0, 32).trim();
  if (name) await db.worlds.updateOne({ _id: w._id }, { $set: { name } });
  res.json({ ok: true });
});

router.post("/:id/members", async (req, res) => {
  const w = await loadWorld(req.params.id);
  if (!w || !w.owner.equals(req.user._id)) return res.status(404).json({ error: "World not found." });
  const uid = oid((req.body || {}).userId);
  if (!uid || !(req.user.friends || []).some((f) => f.equals(uid))) return res.status(400).json({ error: "You can only add friends." });
  await db.worlds.updateOne({ _id: w._id }, { $addToSet: { members: uid } });
  res.json({ ok: true });
});

router.delete("/:id/members/:userId", async (req, res) => {
  const w = await loadWorld(req.params.id);
  const uid = oid(req.params.userId);
  if (!w || !uid) return res.status(404).json({ error: "World not found." });
  const self = uid.equals(req.user._id);
  if (!w.owner.equals(req.user._id) && !self) return res.status(403).json({ error: "Only the owner can remove players." });
  await db.worlds.updateOne({ _id: w._id }, { $pull: { members: uid } });
  kickFromWorld(String(w._id), String(uid));
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  const w = await loadWorld(req.params.id);
  if (!w || !w.owner.equals(req.user._id)) return res.status(404).json({ error: "World not found." });
  await db.worlds.deleteOne({ _id: w._id });
  kickFromWorld(String(w._id));
  res.json({ ok: true });
});

export default router;
