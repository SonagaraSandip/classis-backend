import express from "express";
import { saveMarks, getStudentMarks , getMarksForPDF } from "../controllers/markController.js";

const router = express.Router();

router.post("/", saveMarks);
router.get("/student/:studentId", getStudentMarks);
router.get("/pdf-data", getMarksForPDF);

export default router;
