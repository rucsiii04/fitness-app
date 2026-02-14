import express from "express"
import {controllers} from "../controllers/index.js"
import { verifyToken } from "../middleware/verifyToken.js"

export const router=express.Router()

router.post("/",verifyToken,controllers.profileController.createProfile)
router.get("/",verifyToken,controllers.profileController.getProfile)
router.put("/",verifyToken,controllers.profileController.updateProfile)

