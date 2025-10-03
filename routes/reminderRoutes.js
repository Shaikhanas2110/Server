import { Router } from "express";
import { googleAuth, oauthCallback, setReminder } from "../controllers/reminderController.js";

const router = Router();

router.get("/auth", googleAuth);
router.get("/oauth2callback", oauthCallback);
router.get("/set-reminder/:id", setReminder);

export default router;
