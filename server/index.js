import http from "node:http";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";
import { attachRealtime } from "./realtime.js";

const server = http.createServer(createApp());
attachRealtime(server);
server.listen(config.port, () => console.log(`Meadowvale server listening on port ${config.port}`));

async function connectWithRetry(attempt = 1) {
  try {
    await connectDb();
    console.log("Connected to MongoDB");
  } catch (e) {
    const wait = Math.min(60, 5 * attempt);
    console.error(`MongoDB connection failed (attempt ${attempt}): ${e.message}`);
    if (/SSL alert number 80|tlsv1 alert internal error/i.test(e.message))
      console.error("Hint: MongoDB Atlas is rejecting this server's IP. Add it (or 0.0.0.0/0) under Atlas → Network Access.");
    console.error(`Retrying in ${wait}s…`);
    setTimeout(() => connectWithRetry(attempt + 1), wait * 1000);
  }
}
connectWithRetry();
