import express from "express";
import { getAnalyticsSummary, recordEventBatch } from "../controllers/EventController.js";

const router = express.Router();

router.post("/", recordEventBatch);
router.get("/summary", getAnalyticsSummary);

export default router;
