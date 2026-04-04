import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";

export const router = express.Router();

router.get(
  "/",
  verifyToken,
  controllers.workoutController.getAll
);

router.get(
  "/:id",
  verifyToken,
  controllers.workoutController.getById
);

router.get(
  "/admin/all",
  verifyToken,
  requireRole("admin_global"),
  controllers.workoutController.getAllAdmin 
);


router.post(
  "/",
  verifyToken,
  controllers.workoutController.create
);


router.put(
  "/:id",
  verifyToken,
  controllers.workoutController.update
);


router.delete(
  "/:id",
  verifyToken,
  controllers.workoutController.delete
);


router.post(
  "/:id/restore",
  verifyToken,
  controllers.workoutController.restore
);