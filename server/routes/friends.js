import { Router } from "express";
import { db, oid } from "../db.js";
import { requireUser, publicUser } from "../auth.js";
import { isOnline, activeWorldOf } from "../realtime.js";

const router = Router();
router.use(requireUser);

const ids = (list) => (list || []).map(String);
async function summaries(idList) {
  if (!idList.length) return [];
  const users = await db.users.find({ _id: { $in: idList.map(oid) } }, { projection: { username: 1 } }).toArray();
  return users.map((u) => ({ ...publicUser(u), online: isOnline(String(u._id)), playing: activeWorldOf(String(u._id)) }));
}

router.get("/", async (req, res) => {
  const u = req.user;
  res.json({ friends: await summaries(u.friends || []), incoming: await summaries(u.incoming || []), outgoing: await summaries(u.outgoing || []) });
});

router.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (q.length < 2) return res.json({ users: [] });
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = await db.users.find({ usernameLower: { $regex: "^" + esc }, _id: { $ne: req.user._id } }, { projection: { username: 1 } }).limit(20).toArray();
  const me = req.user, rel = (id) => (ids(me.friends).includes(id) ? "friend" : ids(me.outgoing).includes(id) ? "sent" : ids(me.incoming).includes(id) ? "incoming" : "none");
  res.json({ users: found.map((u) => ({ ...publicUser(u), relation: rel(String(u._id)), online: isOnline(String(u._id)) })) });
});

router.post("/request", async (req, res) => {
  const name = String((req.body || {}).username || "").toLowerCase();
  const other = await db.users.findOne({ usernameLower: name });
  if (!other) return res.status(404).json({ error: "No player with that username." });
  if (other._id.equals(req.user._id)) return res.status(400).json({ error: "That's you!" });
  if (ids(req.user.friends).includes(String(other._id))) return res.json({ ok: true, status: "friend" });
  if (ids(req.user.incoming).includes(String(other._id))) {
    await befriend(req.user._id, other._id);
    return res.json({ ok: true, status: "friend" });
  }
  await db.users.updateOne({ _id: req.user._id }, { $addToSet: { outgoing: other._id } });
  await db.users.updateOne({ _id: other._id }, { $addToSet: { incoming: req.user._id } });
  res.json({ ok: true, status: "sent" });
});

async function befriend(a, b) {
  await db.users.updateOne({ _id: a }, { $addToSet: { friends: b }, $pull: { incoming: b, outgoing: b } });
  await db.users.updateOne({ _id: b }, { $addToSet: { friends: a }, $pull: { incoming: a, outgoing: a } });
}

router.post("/accept", async (req, res) => {
  const other = oid((req.body || {}).userId);
  if (!other || !ids(req.user.incoming).includes(String(other))) return res.status(400).json({ error: "No such friend request." });
  await befriend(req.user._id, other);
  res.json({ ok: true });
});

router.post("/decline", async (req, res) => {
  const other = oid((req.body || {}).userId);
  if (!other) return res.status(400).json({ error: "Bad request." });
  await db.users.updateOne({ _id: req.user._id }, { $pull: { incoming: other, outgoing: other } });
  await db.users.updateOne({ _id: other }, { $pull: { incoming: req.user._id, outgoing: req.user._id } });
  res.json({ ok: true });
});

router.delete("/:userId", async (req, res) => {
  const other = oid(req.params.userId);
  if (!other) return res.status(400).json({ error: "Bad request." });
  await db.users.updateOne({ _id: req.user._id }, { $pull: { friends: other } });
  await db.users.updateOne({ _id: other }, { $pull: { friends: req.user._id } });
  res.json({ ok: true });
});

export default router;
