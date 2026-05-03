import http from "http";
import express from "express";
import dotenv from "dotenv";
import { initDatabase } from "./models/index.js";
import { startSessionMaintenanceCron } from "./cron/sessionMaintenance.js";
import { initSocket } from "./socket.js";

dotenv.config();
import { router } from "./routes/index.js";

const app = express();
const server = http.createServer(app);
const port = 8080;

app.use(express.json());
app.use("/api", router);

const startServer = async () => {
  await initDatabase();
  initSocket(server);
  startSessionMaintenanceCron();
  server.listen(port, () => {
    console.log(`Aplicatia ruleaza pe http://localhost:${port}`);
  });
};

startServer();
