import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";

export const router = express.Router();

router.post(
  "/trainer-requests",
  verifyToken,
  requireRole("trainer", "client"),
  controllers.userController.sendRequest,
);
router.patch(
  "/trainer-requests/:requestId",
  verifyToken,
  requireRole("trainer", "client"),
  controllers.userController.respondToRequest,
);

router.get(
  "/trainer/clients",
  verifyToken,
  requireRole("trainer"),
  controllers.getAcceptedClients,
);
router.get("/trainer/my-trainer", verifyToken, controllers.getMyTrainer);
router.get(
  "/gyms/:gymId/clients",
  verifyToken,
  requireRole("trainer", "gym_admin"),
  controllers.userController.getClientsByGym,
);
router.get(
  "/gyms/:gymId/trainers",
  verifyToken,
  requireRole("client", "gym_admin"),
  controllers.userController.getTrainersByGym,
);
