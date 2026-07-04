import express from "express"
import {controllers} from "../controllers/index.js"
import { verifyToken } from "../middleware/verifyToken.js"
import { createProfileValidation, updateProfileValidation } from "../validators/profileValidators.js"
import { handleValidation } from "../validators/handleValidation.js"

export const router=express.Router()

router.post("/", verifyToken, createProfileValidation, handleValidation, controllers.profileController.createProfile)
router.get("/", verifyToken, controllers.profileController.getProfile)
router.put("/", verifyToken, updateProfileValidation, handleValidation, controllers.profileController.updateProfile)

