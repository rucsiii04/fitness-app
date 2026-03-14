import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";

export const router = express.Router();

router.get(
  "/gyms/:gymId/types",
  controllers.membershipController.getMembershipTypesByGym,
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
  requireRole("gym_admin", "front_desk"),
  controllers.membershipController.issueMembership,
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
