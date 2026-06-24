import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Screenshot from "../models/Screenshot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_ROOT = path.resolve(__dirname, "../uploads/screenshots");
const PUBLIC_UPLOAD_PREFIX = "/api/uploads/screenshots";

const normalizeRoute = (route = "") => route.split("#")[0].trim();

const toPublicRecord = (screenshot) => ({
  route: screenshot.route,
  path: screenshot.path,
  url: `http://localhost:${process.env.PORT || 5000}${screenshot.path}`,
  width: screenshot.width,
  height: screenshot.height,
  createdAt: screenshot.createdAt,
});

const filenameForRoute = (route) => {
  const hash = crypto.createHash("sha1").update(route).digest("hex");
  return `${hash}.png`;
};

export const screenshotExists = async (req, res) => {
  try {
    const route = normalizeRoute(req.query.route);
    if (!route) {
      return res.status(400).json({ success: false, message: "route is required" });
    }

    const screenshot = await Screenshot.findOne({ route });
    return res.status(200).json({
      success: true,
      exists: Boolean(screenshot),
      data: screenshot ? toPublicRecord(screenshot) : null,
    });
  } catch (error) {
    console.error("Error checking screenshot:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getScreenshotByRoute = async (req, res) => {
  try {
    const route = normalizeRoute(req.query.route);
    if (!route) {
      return res.status(400).json({ success: false, message: "route is required" });
    }

    const screenshot = await Screenshot.findOne({ route });
    if (!screenshot) {
      return res.status(404).json({ success: false, message: "Screenshot not found" });
    }

    return res.status(200).json({ success: true, data: toPublicRecord(screenshot) });
  } catch (error) {
    console.error("Error fetching screenshot:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const uploadScreenshot = async (req, res) => {
  try {
    const route = normalizeRoute(req.body.route);
    const { imageData, width, height } = req.body;

    if (!route || !imageData || !width || !height) {
      return res.status(400).json({ success: false, message: "route, imageData, width and height are required" });
    }

    const existing = await Screenshot.findOne({ route });
    if (existing) {
      return res.status(200).json({ success: true, duplicate: true, data: toPublicRecord(existing) });
    }

    const match = imageData.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: "imageData must be a PNG data URL" });
    }

    await fs.mkdir(UPLOAD_ROOT, { recursive: true });

    const filename = filenameForRoute(route);
    const diskPath = path.join(UPLOAD_ROOT, filename);
    const publicPath = `${PUBLIC_UPLOAD_PREFIX}/${filename}`;

    await fs.writeFile(diskPath, Buffer.from(match[1], "base64"));

    const screenshot = await Screenshot.create({
      route,
      path: publicPath,
      width: Number(width),
      height: Number(height),
    });

    return res.status(201).json({ success: true, duplicate: false, data: toPublicRecord(screenshot) });
  } catch (error) {
    if (error.code === 11000) {
      const screenshot = await Screenshot.findOne({ route: normalizeRoute(req.body.route) });
      return res.status(200).json({ success: true, duplicate: true, data: toPublicRecord(screenshot) });
    }

    console.error("Error uploading screenshot:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
