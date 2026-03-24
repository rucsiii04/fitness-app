import express from "express";
import dotenv from "dotenv";
import { initDatabase } from "./models/index.js";
import { startSessionMaintenanceCron } from "./cron/sessionMaintenance.job.js";

dotenv.config();
import { router } from "./routes/index.js";

const app = express();

const port = 8080;
app.use(express.json());
app.use("/api", router);

const startServer = async () => {
  await initDatabase();

  startSessionMaintenanceCron();
  app.listen(port, () => {
    console.log(`Aplicatia ruleaza pe http://localhost:${port}`);
  });
};

startServer();
