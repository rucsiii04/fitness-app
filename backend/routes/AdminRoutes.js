import express from "express"
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";
import { createGymValidation, updateGymValidation } from "../validators/gymValidators.js";
import { handleValidation } from "../validators/handleValidation.js";
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
  createGymValidation,
  handleValidation,
  controllers.adminController.createGym
)
router.get(
  "/gyms",
  verifyToken,
  requireRole("gym_admin"),
  controllers.adminController.getMyGyms
)

router.put(
  "/gym/:gymId",
  verifyToken,
  requireRole("gym_admin"),
  updateGymValidation,
  handleValidation,
  controllers.adminController.updateGym
)

router.delete(
  "/gym/:gymId",
  verifyToken,
  requireRole("gym_admin"),
  controllers.adminController.deleteGym
)

router.put(
  "/trainers/:trainerId",
  verifyToken,
  requireRole("gym_admin"),
  controllers.adminController.updateTrainer
)

router.delete(
  "/trainers/:trainerId",
  verifyToken,
  requireRole("gym_admin"),
  controllers.adminController.deleteTrainer
)

router.get("/gyms/all", verifyToken, controllers.adminController.getAllGyms)

router.put(
  "/gym/:gymId/alert",
  verifyToken,
  requireRole("gym_admin"),
  controllers.gymController.setAlert
)

router.get(
  "/gyms/:gymId/attendance/stats",
  verifyToken,
  requireRole("gym_admin"),
  controllers.adminController.getAttendanceStats
)

router.get(
  "/gyms/:gymId/revenue/stats",
  verifyToken,
  requireRole("gym_admin"),
  controllers.adminController.getRevenueStats
)

router.get(
  "/gyms/:gymId/export/memberships",
  verifyToken,
  requireRole("gym_admin"),
  controllers.exportController.exportMemberships
)

router.get(
  "/gyms/:gymId/export/users",
  verifyToken,
  requireRole("gym_admin"),
  controllers.exportController.exportUsers
)

router.get(
  "/gyms/:gymId/export/checkins",
  verifyToken,
  requireRole("gym_admin"),
  controllers.exportController.exportCheckins
)