import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";

import {
  registerValidation,
  loginValidation,
  requestResetValidation,
  resetPasswordValidation,
  updatePasswordValidation,
} from "../validators/authValidators.js";

import { handleValidation } from "../validators/handleValidation.js";

export const authRouter = express.Router();

authRouter.post(
  "/register",
  registerValidation,
  handleValidation,
  controllers.authController.register,
);

authRouter.post(
  "/login",
  loginValidation,
  handleValidation,
  controllers.authController.login,
);

authRouter.get(
  "/me",
  verifyToken,
  controllers.authController.me,
);

authRouter.put(
  "/update-password",
  verifyToken,
  updatePasswordValidation,
  handleValidation,
  controllers.authController.updatePassword,
);

authRouter.put(
  "/update-account",
  verifyToken,
  controllers.authController.updateAccount,
);

authRouter.post(
  "/request-reset-password",
  requestResetValidation,
  handleValidation,
  controllers.authController.requestPasswordReset,
);

authRouter.post(
  "/reset-password",
  resetPasswordValidation,
  handleValidation,
  controllers.authController.resetPassword,
);
