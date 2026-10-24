import { Router } from "express";
import { db } from "../db.js";

const router = Router();
const FIELDS = { coins: "stats.coins", level: "stats.level", pop: "stats.pop", cities: "stats.cities", buildings: "stats.buildings" };

router.get("/", async (req, res) => {
  const by = FIELDS[req.query.by] ? req.query.by : "pop";
  const rows = await db.worlds
    .aggregate([
      { $match: { mode: { $ne: "creative" }, saveSize: { $gt: 0 } } },
      { $sort: { [FIELDS[by]]: -1 } },
      { $limit: 50 },
      { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "ownerDoc" } },
      { $project: { name: 1, stats: 1, owner: { $arrayElemAt: ["$ownerDoc.username", 0] } } },
    ])
    .toArray();
  res.json({ by, rows: rows.map((r, i) => ({ rank: i + 1, id: String(r._id), name: r.name, owner: r.owner || "?", stats: r.stats || {} })) });
});

export default router;
