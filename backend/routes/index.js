import express from "express";
import { authRouter } from "./Auth.js";
import { router as profileRouter } from "./profile.js";
import { router as adminRouter } from "./AdminRoutes.js";
import { router as globalAdminRouter } from "./adminGlobalRoutes.js";
import { router as trainerRouter } from "./trainerRoutes.js";
import { router as membershipRouter } from "./membershipRoutes.js";

export const router = express.Router();

router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/gym-admin", adminRouter);
router.use("/global-admin", globalAdminRouter);
router.use("/trainer", trainerRouter);
router.use("/memberships", membershipRouter);
