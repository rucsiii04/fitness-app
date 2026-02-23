import express from "express"
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import {requireRole} from "../middleware/requireRole.js"
export const router=express.Router()

router.post(
  "/trainers",
  verifyToken,
  requireRole("gym_admin"),
  controllers.adminController.createTrainer
);
router.post(
  "/gym",
  verifyToken,
  requireRole("gym_admin"),
  controllers.adminController.createGym
)
router.get(
  "/gyms",
  verifyToken,
  requireRole("gym_admin"),
  controllers.adminController.getMyGyms
)