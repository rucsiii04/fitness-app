import express from "express";
import sequelize from "sequelize";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./models/index.js";

dotenv.config();
import { router } from "./routes/index.js";

const app = express();

const port = 8080;
initDatabase();
app.use(express.json());
app.use("/api", router);
app.listen(port, () => {
  console.log(`Aplicatia ruleaza pe http://localhost:${port}`);
});
