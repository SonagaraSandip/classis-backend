import Mark from "../models/Mark.js";

export const saveMarks = async (req, res) => {
  try {
    const { studentId, testId, obtainedMarks } = req.body;

    if (!studentId || !testId || !Number.isFinite(obtainedMarks)) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    //duplicate check
    const existingMark = await Mark.findOne({ studentId, testId });

    if (existingMark) {
      return res
        .status(400)
        .json({ message: "Mark already enternd for this student and test" });
    }

    // calculate percentage later (optional)
    const mark = new Mark({
      studentId,
      testId,
      obtainedMarks,
    });

    await mark.save();
    res.status(201).json(mark);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;

    const marks = await Mark.find({ studentId })
      .populate("testId", "standard subject testName totalMarks date")
      .sort({ createdAt: -1 });

    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMarksForPDF = async (req, res) => {
  try {
    const { testId } = req.query;

    if (!testId) {
      return res.status(400).json({ message: "testId is required" });
    }

    const marks = await Mark.find({ testId })
      .populate("studentId", "name standard")
      .populate("testId", "subject totalMarks");

    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
