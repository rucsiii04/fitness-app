import express from "express";
import { authRouter } from "./Auth.js";
export const router = express.Router();

router.use("/auth", authRouter);
