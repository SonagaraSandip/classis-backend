import express from "express";
import {
  getStandards,
  createStandard,
  addSubjectToStandard,
  removeSubjectFromStandard,
  deleteStandard,
} from "../controllers/standardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getStandards);
router.post("/", authMiddleware, createStandard);
router.post("/:id/subjects", authMiddleware, addSubjectToStandard);
router.delete("/:id/subjects/:subject", authMiddleware, removeSubjectFromStandard);
router.delete("/:id", authMiddleware, deleteStandard);

export default router;
