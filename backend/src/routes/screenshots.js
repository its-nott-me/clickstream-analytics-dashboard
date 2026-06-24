import express from "express";
import { getScreenshotByRoute, screenshotExists, uploadScreenshot } from "../controllers/ScreenshotController.js";

const router = express.Router();

router.get("/", getScreenshotByRoute);
router.get("/exists", screenshotExists);
router.post("/", uploadScreenshot);

export default router;
