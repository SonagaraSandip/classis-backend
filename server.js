import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { startGuestCleanupCron } from "./cron/cleanupGuestData.js";

import studentRoutes from "./routes/studentRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import markRoutes from "./routes/markRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";

dotenv.config();

const app = express();

// 🔥 MIDDLEWARE (ORDER MATTERS)
app.use(cors());
app.use(express.json()); // MUST be before routes

// ROUTES
app.use("/api/students", studentRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/marks", markRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pdf", pdfRoutes);

if (
  process.env.NODE_ENV === "production" &&
  process.env.MONGO_URL.includes("classis_dev")
) {
  throw new Error("❌ Production cannot use DEV database");
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});


// DB CONNECT
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ MongoDB connected");
    console.log("📦 Database:", mongoose.connection.name);
    //start cron after db connect
    startGuestCleanupCron();
  })
  .catch((err) => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
