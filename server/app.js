import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { config } from "./config.js";
import { db } from "./db.js";
import authRoutes from "./routes/auth.js";
import friendRoutes from "./routes/friends.js";
import worldRoutes from "./routes/worlds.js";
import leaderboardRoutes from "./routes/leaderboard.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "64mb" }));
  if (config.corsOrigin) {
    const allowed = config.corsOrigin.split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin && (allowed.includes("*") || allowed.includes(origin))) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      if (req.method === "OPTIONS") return res.sendStatus(204);
      next();
    });
  }
  app.get("/api/health", (req, res) => res.status(db.users ? 200 : 503).json({ ok: !!db.users, db: db.users ? "connected" : "connecting" }));
  app.use("/api", (req, res, next) => (db.users ? next() : res.status(503).json({ error: "The server is starting up - try again in a moment." })));
  app.use("/api/auth", authRoutes);
  app.use("/api/friends", friendRoutes);
  app.use("/api/worlds", worldRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);
  app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));
  const dist = path.join(root, "dist");
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
  }
  app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(err.type === "entity.too.large" ? 413 : 500).json({ error: err.type === "entity.too.large" ? "That save is too large." : "Something went wrong on the server." });
  });
  return app;
}
