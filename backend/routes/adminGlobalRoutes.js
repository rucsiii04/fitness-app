import express from "express"
import { verifyToken } from "../middleware/verifyToken.js"
import { requireRole } from "../middleware/requireRole.js"
import { controllers } from "../controllers/index.js"
import { runSessionMaintenance } from "../cron/sessionMaintenance.js"

export const router=express.Router()

router.post(
    "/gym-admin",
    verifyToken,
    requireRole("admin_global"),
    controllers.globalAdminController.createGymAdmin
)

//pentru verificaari
router.post("/run-maintenance", async (req, res) => {
  await runSessionMaintenance();
  res.json({ message: "Maintenance executed" });
});