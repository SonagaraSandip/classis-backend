import Student from "../models/Student.js";
import Test from "../models/Test.js";
import Mark from "../models/Mark.js";

export const saveMarks = async (req, res) => {
  const { studentId, testId, obtainedMarks } = req.body;

  if (!studentId || !testId || !Number.isFinite(obtainedMarks)) {
    return res.status(400).json({ message: "Invalid data" });
  }

  const exists = await Mark.findOne({ studentId, testId });
  if (exists) {
    return res.status(400).json({ message: "Marks already entered" });
  }

  const mark = await Mark.create({ studentId, testId, obtainedMarks });
  res.status(201).json(mark);
};

export const getPDFDataByDate = async (req, res) => {
  try {
    const { testDate } = req.query;
    if (!testDate) {
      return res.status(400).json({ message: "testDate required" });
    }

    //find all tests on this date
    const tests = await Test.find({
      testDate: new Date(testDate),
    });

    if (tests.length === 0) return res.json([]);

    const testIds = tests.map((t) => t._id);

    //Get all marks for these tests
    const marks = await Mark.find({ testId: { $in: testIds } })
      .populate("studentId", "name standard")
      .populate("testId", "subject totalMarks testDate");

    //get all students ( for absent logic)
    const students = await Student.find();

    res.json({ tests, marks, students });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error while get PDF Data By Date" });
  }
};

export const getMarksByDate = async (req, res) => {
  try {
    const { testDate } = req.query;

    if (!testDate) {
      return res.status(400).json({ message: "TestDate is required" });
    }

    const marks = await Mark.find()
      .populate({
        path: "testId",
        match: { testDate: new Date(testDate) },
        select: "subject totalMarks testDate",
      })
      .populate("studentId", "name standard");

    //remove null testId results
    const filtered = marks.filter((m) => m.testId !== null);

    res.json(filtered);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error while fetching vie date", error: err.message });
  }
};

export const updateMark = async (req, res) => {
  try {
    const { id } = req.params;
    const { obtainedMarks } = req.body;
    

    if (!Number.isFinite(obtainedMarks)) {
      return res.status(400).json({ message: "Invalid marks" });
    }

    const mark = await Mark.findByIdAndUpdate(
      id,
      { obtainedMarks },
      { new: true }
    );
    if (!mark) {
      return res.status(404).json({ message: "Mark not found" });
    }

    res.json(mark);
  } catch (err) {
    res.status(500).json({ message: "Failed to Updated marks" });
  }
};
