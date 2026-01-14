import Test from "../models/Test.js";

export const createTest = async (req, res) => {
  try {
    // console.log("REQ BODY:", req.body); // 🔍 debug once

    const { standard, testDate } = req.body;

    if (!standard || !testDate) {
      return res.status(400).json({ message: "All fields required" });
    }

    const start = new Date(testDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(testDate);
    end.setHours(23, 59, 59, 999);

    // prevent duplicate test session for same class + date
    const existing = await Test.findOne({
      standard,
      testDate: {
        $gte: start,
        $lte: end,
      },
      isGuest: req.user?.role === "guest",
    });

    if (existing) {
      return res.status(200).json(existing);
    }

    const test = await Test.create({
      standard,
      testDate,
      isGuest: req.user?.role === "guest",
    });

    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
