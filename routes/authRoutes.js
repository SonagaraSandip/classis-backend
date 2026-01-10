import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ message: "Login key required !" });
  }

  //hardcorded teacher key checked
  if (key !== process.env.TEACHER_LOGIN_KEY) {
    return res.status(401).json({ message: "Invalid login key" });
  }

  //generate JWT token
  const token = jwt.sign(
    {
      role: "teacher",
      userId: "teacher-1", // fixed for now
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    role: "teacher",
  });
});

router.post("/guest", (req, res) => {
  const token = jwt.sign(
    {
      role: "guest",
      userId: `guest-${Date.now()}`,
      isGuest: true,
      createdAt: Date.now(),
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({
    token,
    role: "guest",
    message: "Guest Login successful (Data auto-delete after 12 hours)",
  });
});

export default router;
