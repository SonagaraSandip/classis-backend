import express from "express";
import {
  saveMarks,
  bulkSaveMarks,
  getPDFDataByDate,
  getMarksByDate,
  updateMark,
} from "../controllers/markController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, saveMarks);
router.post("/bulk", authMiddleware, bulkSaveMarks);
router.get("/pdf-by-date", authMiddleware, getPDFDataByDate);
router.get("/by-date", authMiddleware, getMarksByDate);
router.put("/:id", authMiddleware, updateMark);

export default router;
