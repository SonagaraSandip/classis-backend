import express from "express";
import {
  addStudent,
  getStudents,
  getStudentProfile,
} from "../controllers/studentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware ,  addStudent);
router.get("/", authMiddleware ,  getStudents);
router.get("/:id/profile", authMiddleware ,  getStudentProfile);

export default router;
