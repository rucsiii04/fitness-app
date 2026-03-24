import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";

export const router = express.Router();

router.get(
  "/gyms/:gymId/types",
  controllers.classController.getClassTypesByGym,
);

router.post(
  "/types",
  verifyToken,
  requireRole("gym_admin"),
  controllers.classController.createClassType,
);

router.get(
  "/gyms/:gymId/sessions",
  controllers.classController.getSessionsByGym,
);

router.post(
  "/sessions",
  verifyToken,
  requireRole("trainer", "gym_admin"),
  controllers.classController.createClassSession,
);

router.post(
  "/sessions/:sessionId/enroll",
  verifyToken,
  requireRole("client"),
  controllers.classController.enrollInSession,
);

router.delete(
  "/sessions/:sessionId/enroll",
  verifyToken,
  requireRole("client"),
  controllers.classController.cancelEnrollment,
);

router.get(
  "/sessions/:sessionId/enrollments",
  verifyToken,
  requireRole("trainer", "gym_admin"),
  controllers.classController.getSessionEnrollments,
);

router.patch(
  "/sessions/:sessionId/cancel",
  verifyToken,
  requireRole("trainer", "gym_admin"),
  controllers.classController.cancelSession,
);

router.get(
  "/my/enrollments",
  verifyToken,
  requireRole("client"),
  controllers.classController.getMyEnrollments,
);

router.patch(
  "/enrollments/:enrollmentId/attendance",
  verifyToken,
  requireRole("trainer", "gym_admin"),
  controllers.classController.markAttendance,
);