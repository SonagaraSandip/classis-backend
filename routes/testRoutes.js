import express from "express";
import { createTest } from "../controllers/testController.js";

const router = express.Router();

router.post("/", createTest);

export default router;
