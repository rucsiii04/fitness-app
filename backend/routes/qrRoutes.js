import express from "express";

import { controllers } from "../controllers/index.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";


export const router=express.Router();


router.post("/generate",verifyToken,requireRole("client"),controllers.qrController.generateQR);

router.post("/scan",verifyToken,requireRole("front_desk","gym_admin"),controllers.qrController.scanQR);