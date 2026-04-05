import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";

export const router = express.Router();

router.post("/conversations", verifyToken, requireRole("client"), controllers.aiController.startConversation);

router.get("/conversations", verifyToken, requireRole("client"), controllers.aiController.getMyConversations);

router.get("/conversations/:conversationId/messages", verifyToken, requireRole("client"), controllers.aiController.getMessages);

router.post("/conversations/:conversationId/messages", verifyToken, requireRole("client"), controllers.aiController.sendMessage);

router.post("/conversations/:conversationId/generate-plan", verifyToken, requireRole("client"), controllers.aiController.generatePlan);