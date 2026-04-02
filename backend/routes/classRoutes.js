import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";

export const router = express.Router();


router.get(
  "/gyms/:gymId/class-types",
  controllers.classController.getClassTypesByGym
);


router.post(
  "/class-types",
  verifyToken,
  requireRole("gym_admin"),
  controllers.classController.createClassType
);


router.get(
  "/gyms/:gymId/class-sessions",
  controllers.classController.getSessionsByGym
);

router.post(
  "/class-sessions",
  verifyToken,
  requireRole("trainer", "gym_admin"),
  controllers.classController.createClassSession
);


router.patch(
  "/class-sessions/:sessionId/cancel",
  verifyToken,
  requireRole("trainer", "gym_admin"),
  controllers.classController.cancelSession
);


router.post(
  "/class-sessions/:sessionId/enrollments",
  verifyToken,
  requireRole("client"),
  controllers.classController.enrollInSession
);


router.delete(
  "/class-sessions/:sessionId/enrollments",
  verifyToken,
  requireRole("client"),
  controllers.classController.cancelEnrollment
);


router.get(
  "/class-sessions/:sessionId/enrollments",
  verifyToken,
  requireRole("trainer", "gym_admin"),
  controllers.classController.getSessionEnrollments
);


router.get(
  "/enrollments/my",
  verifyToken,
  requireRole("client"),
  controllers.classController.getMyEnrollments
);

router.patch(
  "/enrollments/:enrollmentId/attendance",
  verifyToken,
  requireRole("trainer", "gym_admin"),
  controllers.classController.markAttendance
);