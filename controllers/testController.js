import Test from "../models/Test.js";

export const createTest = async (req, res) => {
  try {
    const { standard, subject, testName, totalMarks, date } = req.body;

    if (!standard || !subject || !totalMarks) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const test = new Test({
      standard,
      subject,
      testName,
      totalMarks,
      date
    });

    await test.save();
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
