import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();
export const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    timezone: "+03:00",
    // logging: false,
  },
);
