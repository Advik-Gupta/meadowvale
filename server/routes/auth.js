import { Router } from "express";
import { db } from "../db.js";
import { hashPassword, checkPassword, signToken, requireUser, publicUser } from "../auth.js";

const router = Router();
const attempts = new Map();

function rateLimited(ip) {
  const now = Date.now(), list = (attempts.get(ip) || []).filter((t) => now - t < 60000);
  list.push(now);
  attempts.set(ip, list);
  return list.length > 12;
}

function validate(username, password) {
  if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,20}$/.test(username)) return "Usernames are 3–20 letters, numbers or underscores.";
  if (typeof password !== "string" || password.length < 6 || password.length > 200) return "Passwords need at least 6 characters.";
  return null;
}

router.post("/signup", async (req, res) => {
  if (rateLimited(req.ip)) return res.status(429).json({ error: "Too many attempts — wait a minute." });
  const { username, password } = req.body || {};
  const bad = validate(username, password);
  if (bad) return res.status(400).json({ error: bad });
  const { salt, hash } = hashPassword(password);
  const user = { username, usernameLower: username.toLowerCase(), salt, hash, friends: [], incoming: [], outgoing: [], createdAt: new Date() };
  try {
    const r = await db.users.insertOne(user);
    user._id = r.insertedId;
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "That username is taken." });
    throw e;
  }
  res.json({ token: signToken(user._id), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  if (rateLimited(req.ip)) return res.status(429).json({ error: "Too many attempts — wait a minute." });
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") return res.status(400).json({ error: "Enter your username and password." });
  const user = await db.users.findOne({ usernameLower: username.toLowerCase() });
  if (!user || !checkPassword(password, user.salt, user.hash)) return res.status(401).json({ error: "Wrong username or password." });
  res.json({ token: signToken(user._id), user: publicUser(user) });
});

router.get("/me", requireUser, (req, res) => res.json({ user: publicUser(req.user) }));
router.post("/ping", requireUser, (req, res) => res.json({ ok: true }));

export default router;
