import express from "express";
import { getSessions, getSessionEvents } from "../controllers/EventController.js";

const router = express.Router();

router.get("/", getSessions);
router.get("/:sessionId/events", getSessionEvents);

export default router;
