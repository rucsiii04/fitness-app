import express from "express";
import { authRouter } from "./Auth.js";
import { router as profileRouter } from "./profile.js";
export const router = express.Router();

router.use("/auth", authRouter);
router.use("/profile", profileRouter);
