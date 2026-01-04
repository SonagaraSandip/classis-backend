import express from "express";
import {
  addStudent,
  getStudents,
  getStudentProfile,
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/", addStudent);
router.get("/", getStudents);
router.get("/:id/profile", getStudentProfile);

export default router;
