import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { startSessionValidation } from "../validators/workoutSessionValidators.js";
import { handleValidation } from "../validators/handleValidation.js";
export const router = express.Router();

router.post(
  "/",
  verifyToken,
  startSessionValidation,
  handleValidation,
  controllers.workoutSessionController.start
);

router.put(
  "/:id/finish",
  verifyToken,
  controllers.workoutSessionController.finish,
);

router.put("/:id", verifyToken, controllers.workoutSessionController.update);

router.get("/", verifyToken, controllers.workoutSessionController.getMine);

router.get("/:id", verifyToken, controllers.workoutSessionController.getById);
