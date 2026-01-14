import express from "express";
import { generateClassWisePDF } from "../controllers/pdfController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/classwise-pdf", authMiddleware,  generateClassWisePDF);

export default router;