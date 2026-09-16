import express from "express";
import { createTest, getRecentTestHistory } from "../controllers/testController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createTest);
router.get("/history", authMiddleware, getRecentTestHistory);

export default router;
