import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";
import { upload } from "../config/multer.js";
import { createTrainerProfileValidation } from "../validators/trainerProfileValidators.js";
import { handleValidation } from "../validators/handleValidation.js";
export const router = express.Router();

router.post(
  "/trainer-assignments",
  verifyToken,
  requireRole("trainer", "client"),
  controllers.userController.sendRequest,
);

router.get(
  "/trainer-assignments/inbox",
  verifyToken,
  requireRole("trainer"),
  controllers.userController.getTrainerInbox,
);

router.get(
  "/trainer-assignments/client-inbox",
  verifyToken,
  requireRole("client"),
  controllers.userController.getClientInbox,
);

router.patch(
  "/trainer-assignments/end",
  verifyToken,
  requireRole("client"),
  controllers.userController.endTraining,
);

router.patch(
  "/trainer-assignments/end/:clientId",
  verifyToken,
  requireRole("trainer"),
  controllers.userController.endClientTraining,
);

router.patch(
  "/trainer-assignments/:requestId",
  verifyToken,
  requireRole("trainer", "client"),
  controllers.userController.respondToRequest,
);

router.get(
  "/me/trainer",
  verifyToken,
  requireRole("client"),
  controllers.userController.getMyTrainer,
);

router.get(
  "/me/clients",
  verifyToken,
  requireRole("trainer"),
  controllers.userController.getAcceptedClients,
);

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
router.post(
  "/profile",
  verifyToken,
  requireRole("trainer"),
  upload.single("image"),
  createTrainerProfileValidation,
  handleValidation,
  controllers.trainerProfileController.createTrainerProfile,
);

router.get(
  "/profil",
  verifyToken,
  requireRole("trainer"),
  controllers.trainerProfileController.getTrainerProfile,
);

router.put(
  "/profil",
  verifyToken,
  requireRole("trainer"),
  controllers.trainerProfileController.updateTrainerProfile,
);

router.delete(
  "/profil",
  verifyToken,
  requireRole("trainer"),
  controllers.trainerProfileController.deleteTrainerProfile,
);
