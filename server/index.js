import http from "node:http";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";
import { attachRealtime } from "./realtime.js";

await connectDb();
const server = http.createServer(createApp());
attachRealtime(server);
server.listen(config.port, () => console.log(`Meadowvale server on http://localhost:${config.port}`));
