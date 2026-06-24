import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import eventRoutes from "./routes/events.js";
import sessionRoutes from "./routes/sessions.js";
import heatmapRoutes from "./routes/heatmaps.js";
import screenshotRoutes from "./routes/screenshots.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ type: ["application/json", "text/plain"], limit: "25mb" }));
app.use(morgan("dev"));

// static files
app.use("/api/uploads", express.static("src/uploads"));

// Routes
app.use("/api/events", eventRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/heatmaps", heatmapRoutes);
app.use("/api/screenshots", screenshotRoutes);

// Root Endpoint
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
