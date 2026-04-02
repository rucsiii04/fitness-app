import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";

export const router = express.Router();


router.get("/",verifyToken, controllers.exerciseController.getAll);
router.get("/:id",verifyToken, controllers.exerciseController.getById);

router.get(
  "/admin/all",
  verifyToken,
  requireRole("admin_global"),
  controllers.exerciseController.getAll //includes all exercises, inactive/active
);

router.post(
  "/",
  verifyToken,
  requireRole("admin_global"),
  controllers.exerciseController.create,
);

router.put(
  "/:id",
  verifyToken,
  requireRole("admin_global"),
  controllers.exerciseController.update,
);



router.delete(
  "/:id",
  verifyToken,
  requireRole("admin_global"),
  controllers.exerciseController.delete,
);



router.post(
  "/:id/restore",
  verifyToken,
  requireRole("admin_global"),
  controllers.exerciseController.restore,
);
