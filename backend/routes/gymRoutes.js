import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { controllers } from "../controllers/index.js";

export const router = express.Router();

router.get("/:gymId/alerts", verifyToken, controllers.gymController.getAlert);
