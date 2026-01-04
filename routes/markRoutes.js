import express from "express";
import {
  saveMarks,
  getPDFDataByDate,
  getMarksByDate,
  updateMark,
} from "../controllers/markController.js";

const router = express.Router();

router.post("/", saveMarks);
router.get("/pdf-by-date", getPDFDataByDate);
router.get("/by-date", getMarksByDate);
router.put("/:id", updateMark);

export default router;
