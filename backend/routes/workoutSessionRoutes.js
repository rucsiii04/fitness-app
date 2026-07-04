import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  startSessionValidation,
  updateSessionValidation,
  finishSessionValidation,
  logSetValidation,
} from "../validators/workoutSessionValidators.js";
import { handleValidation } from "../validators/handleValidation.js";

export const router = express.Router();

router.post(
  "/",
  verifyToken,
  startSessionValidation,
  handleValidation,
  controllers.workoutSessionController.start
);

router.put("/:id/finish", verifyToken, finishSessionValidation, handleValidation, controllers.workoutSessionController.finish);
router.delete("/:id/abandon", verifyToken, controllers.workoutSessionController.abandon);

router.put("/:id", verifyToken, updateSessionValidation, handleValidation, controllers.workoutSessionController.update);

router.get("/", verifyToken, controllers.workoutSessionController.getMine);

router.get("/:id", verifyToken, controllers.workoutSessionController.getById);

router.post("/:id/logs", verifyToken, logSetValidation, handleValidation, controllers.workoutSessionController.logSet);

router.get("/:id/logs", verifyToken, controllers.workoutSessionController.getSessionLogs);