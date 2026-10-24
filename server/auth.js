import crypto from "node:crypto";
import { config } from "./config.js";
import { db, oid } from "./db.js";

const b64 = (buf) => Buffer.from(buf).toString("base64url");

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function checkPassword(password, salt, hash) {
  const test = crypto.scryptSync(password, salt, 64);
  const real = Buffer.from(hash, "hex");
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

export function signToken(userId) {
  const body = b64(JSON.stringify({ sub: String(userId), exp: Date.now() + config.tokenTtlDays * 864e5 }));
  const sig = b64(crypto.createHmac("sha256", config.tokenSecret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = b64(crypto.createHmac("sha256", config.tokenSecret).update(body).digest());
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    return data.exp > Date.now() ? data.sub : null;
  } catch {
    return null;
  }
}

export async function userFromToken(token) {
  const id = verifyToken(token);
  if (!id) return null;
  return db.users.findOne({ _id: oid(id) });
}

export function requireUser(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  userFromToken(token)
    .then((user) => {
      if (!user) return res.status(401).json({ error: "Please log in again." });
      req.user = user;
      next();
    })
    .catch(next);
}

export const publicUser = (u) => ({ id: String(u._id), username: u.username });
