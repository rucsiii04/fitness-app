import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  createWorkoutValidation,
  updateWorkoutValidation,
} from "../validators/workoutValidators.js";
import { handleValidation } from "../validators/handleValidation.js";

export const router = express.Router();

router.get("/", verifyToken, controllers.workoutController.getAll);

router.get("/:id", verifyToken, controllers.workoutController.getById);

router.get(
  "/admin/all",
  verifyToken,
  requireRole("admin_global"),
  controllers.workoutController.getAllAdmin,
);

router.post(
  "/",
  verifyToken,
  createWorkoutValidation,
  handleValidation,
  controllers.workoutController.create,
);

router.put(
  "/:id",
  verifyToken,
  updateWorkoutValidation,
  handleValidation,
  controllers.workoutController.update,
);

router.delete("/:id", verifyToken, controllers.workoutController.delete);

router.post("/:id/restore", verifyToken, controllers.workoutController.restore);

router.post("/:id/copy", verifyToken, controllers.workoutController.copy);
