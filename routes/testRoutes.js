import express from "express";
import { createTest } from "../controllers/testController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createTest);

export default router;
