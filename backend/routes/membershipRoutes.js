import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";

export const router = express.Router();

router.get(
  "/gyms/:gymId/types",
  verifyToken,
  controllers.membershipController.getMembershipTypesByGym,
);

router.get(
  "/clients/search",
  verifyToken,
  requireRole("front_desk", "gym_admin"),
  controllers.membershipController.searchClients,
);

router.get(
  "/gyms/:gymId/manage/types",
  verifyToken,
  requireRole("gym_admin"),
  controllers.membershipController.getMembershipTypesForManagedGym,
);

router.post(
  "/types",
  verifyToken,
  requireRole("gym_admin"),
  controllers.membershipController.createMembershipType,
);

router.put(
  "/types/:membershipTypeId",
  verifyToken,
  requireRole("gym_admin"),
  controllers.membershipController.updateMembershipType,
);

router.post(
  "/issue",
  verifyToken,
  requireRole("front_desk", "gym_admin"),
  controllers.membershipController.issueMembership,
);

router.post(
  "/me/pause",
  verifyToken,
  requireRole("client"),
  controllers.membershipController.pauseMyMembership,
);

router.post(
  "/gyms/:gymId/pause-memberships",
  verifyToken,
  requireRole("gym_admin"),
  controllers.membershipController.pauseGymMemberships,
);

router.get(
  "/gyms/:gymId/admin-freeze/status",
  verifyToken,
  requireRole("gym_admin"),
  controllers.membershipController.getAdminFreezeStatus,
);

router.post(
  "/gyms/:gymId/admin-freeze",
  verifyToken,
  requireRole("gym_admin"),
  controllers.membershipController.adminFreezeGymMemberships,
);

router.post(
  "/gyms/:gymId/admin-unfreeze",
  verifyToken,
  requireRole("gym_admin"),
  controllers.membershipController.adminUnfreezeGymMemberships,
);
router.get(
  "/me/current",
  verifyToken,
  controllers.membershipController.getMyCurrentMembership,
);

router.get(
  "/me/history",
  verifyToken,
  controllers.membershipController.getMyMembershipHistory,
);
router.post(
  "/me/resume",
  verifyToken,
  requireRole("client"),
  controllers.membershipController.resumeMyMembership,
);

router.delete(
  "/:membershipId",
  verifyToken,
  requireRole("front_desk", "gym_admin"),
  controllers.membershipController.cancelMembership,
);
