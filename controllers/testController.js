import Test from "../models/Test.js";

export const createTest = async (req, res) => {
  try {
    // console.log("REQ BODY:", req.body); // 🔍 debug once

    const { standard, subject, testDate, totalMarks } = req.body;

    if (!standard || !subject || !testDate || !totalMarks) {
      return res.status(400).json({ message: "All fields required" });
    }

    const test = await Test.create({
      standard,
      subject,
      testDate,
      totalMarks
    });

    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
