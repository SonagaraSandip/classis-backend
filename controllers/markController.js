import Student from "../models/Student.js";
import Test from "../models/Test.js";
import Mark from "../models/Mark.js";
import { subjectsByStandard } from "../config/subjectsByStandard.js";

export const saveMarks = async (req, res) => {
  const { studentId, testId, subject, totalMarks, obtainedMarks, status } =
    req.body;

  if (!studentId || !testId) {
    return res.status(400).json({ message: "Invalid data" });
  }

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });

  // ✅ Validate subject for standard
  if (!subjectsByStandard[student.standard]?.includes(subject)) {
    return res.status(400).json({ message: "Invalid subject for class" });
  }

  if (!subject || !Number.isFinite(totalMarks)) {
    return res
      .status(400)
      .json({ message: "Subject and totalmarks are required" });
  }

  if (status !== "ABSENT" && !Number.isFinite(obtainedMarks)) {
    return res.status(400).json({ message: "Marks required" });
  }

  if (status !== "ABSENT" && obtainedMarks > totalMarks) {
    return res.status(400).json({
      message: `Marks cannot be greater than ${totalMarks}`,
    });
  }

  const mark = await Mark.findOneAndUpdate(
    { studentId, testId },
    {
      subject,
      totalMarks,
      obtainedMarks: status === "ABSENT" ? null : obtainedMarks,
      status,
      isGuest: req.user.role === "guest",
    },
    { upsert: true, new: true }
  );
  return res.status(201).json(mark);
};

export const getPDFDataByDate = async (req, res) => {
  try {
    const { testDate } = req.query;
    if (!testDate) {
      return res.status(400).json({ message: "testDate required" });
    }

    const start = new Date(testDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(testDate);
    end.setHours(23, 59, 59, 999);

    const tests = await Test.find({
      testDate: { $gte: start, $lte: end },
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
      .populate("testId", "testDate");

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

    if (obtainedMarks > mark.totalMarks) {
      return res.status(400).json({
        message: `Marks cannot be greater than ${mark.totalMarks}`,
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
