import express from "express";
import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";

export const authRouter = express.Router();

authRouter.post("/register", controllers.authController.register);
authRouter.post("/login", controllers.authController.login);

authRouter.put(
  "/update-password",
  verifyToken,
  controllers.authController.updatePassword,
);

authRouter.post("/request-reset-password",controllers.authController.requestPasswordReset)
authRouter.post("/reset-password",controllers.authController.resetPassword)