import express from "express";
import { getHeatmaps } from "../controllers/EventController.js";

const router = express.Router();

router.get("/", getHeatmaps);

export default router;
