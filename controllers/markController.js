import Student from "../models/Student.js";
import Test from "../models/Test.js";
import Mark from "../models/Mark.js";

export const saveMarks = async (req, res) => {
  const { studentId, testId, obtainedMarks, status } = req.body;

  if (!studentId || !testId) {
    return res.status(400).json({ message: "Invalid data" });
  }

  //check test exists
  const test = await Test.findById(testId);
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  //❌ same student + sbject + date check
  const alreadyExists = await Mark.findOne({
    studentId,
    testId,
  });

  if (alreadyExists && alreadyExists.testId) {
    return res.status(400).json({
      message: "Marks already entered , please edit",
      markId: alreadyExists._id,
    });
  }

  //absent case
  if (status === "ABSENT") {
    const mark = await Mark.create({
      studentId,
      testId,
      status: "ABSENT",
      obtainedMarks: null,
      isGuest: req.user.role === "guest",
    });
    return res.status(201).json(mark);
  }

  if (!Number.isFinite(obtainedMarks)) {
    return res.status(400).json({ message: "Marks required" });
  }

  //mark > total mark not allowds
  if (obtainedMarks > test.totalMarks) {
    return res
      .status(400)
      .json({ message: `Marks cannot be greater than ${test.totalMarks}` });
  }

  const mark = await Mark.create({
    studentId,
    testId,
    obtainedMarks,
    status: "PRESENT",
    isGuest: req.user?.role === "guest",
  });
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
      isGuest: req.user.role === "guest",
    });

    if (tests.length === 0) return res.json([]);

    const testIds = tests.map((t) => t._id);

    //Get all marks for these tests
    const marks = await Mark.find({
      testId: { $in: testIds },
      isGuest: req.user.role === "guest",
    })
      .populate("studentId", "name standard")
      .populate("testId", "subject totalMarks testDate");

    //get all students ( for absent logic)
    const students = await Student.find({
      isGuest: req.user.role === "guest",
    });

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

    const marks = await Mark.find({ isGuest: req.user.role === "guest" })
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
    const { obtainedMarks, status } = req.body;

    const mark = await Mark.findById(id);
    if (!mark) {
      return res.status(404).json({ message: "Mark not found" });
    }
    if (req.user.role === "guest" && !mark.isGuest) {
      return res.status(400).json({ message: "Not Allowed" });
    }

    //absent case
    if (status === "ABSENT") {
      mark.status = "ABSENT";
      mark.obtainedMarks = null;
      await mark.save();
      return res.json(mark);
    }
    if (!Number.isFinite(obtainedMarks)) {
      return res.status(400).json({ message: "Invalid marks" });
    }

    const test = await Test.findById(mark.testId);
    if (obtainedMarks > test.totalMarks) {
      return res.status(400).json({
        message: `Marks cannot be greater than ${test.totalMarks}`,
      });
    }

    mark.status = "PRESENT";
    mark.obtainedMarks = obtainedMarks;
    await mark.save();

    res.json(mark);
  } catch (err) {
    res.status(500).json({ message: "Failed to Updated marks" });
  }
};
