import express from "express";
import { getHeatmaps, getPageAssets } from "../controllers/EventController.js";

const router = express.Router();

router.get("/", getHeatmaps);
router.get("/page-assets", getPageAssets)

export default router;
