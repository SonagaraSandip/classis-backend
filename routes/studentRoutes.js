import express from "express";
import {
  addStudent,
  getStudentByFilter,
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/", addStudent);
router.get("/", getStudentByFilter);

export default router;
