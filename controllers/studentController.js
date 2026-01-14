import Student from "../models/Student.js";
import Mark from "../models/Mark.js";
import Test from "../models/Test.js";

export const addStudent = async (req, res) => {
  try {
    const student = await Student.create({
      ...req.body,
      isGuest: req.user.role === "guest",
    });
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudents = async (req, res) => {
  const { standard } = req.query;

  const filter = {
    isGuest: req.user.role === "guest",
  };

  if (standard) filter.standard = standard;

  const students = await Student.find(filter).sort({ name: 1 });
  res.json(students);
};

export const getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    // 1️⃣ Get student
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 2️⃣ Get marks history (FIXED SORT)
    const marks = await Mark.find({
      studentId: id,
      isGuest: req.user.role === "guest",
    })
      .populate("testId", "testDate")
      .sort({ createdAt: -1 });

    //merge mark + absent
    const history = marks.map((m) => ({
      testDate: m.testId?.testDate,
      subject: m.subject,
      totalMarks: m.totalMarks,
      obtainedMarks: m.obtainedMarks,
      status: m.status,
    }));

    res.json({
      student,
      history,
    });
  } catch (err) {
    console.error("Student profile error:", err);
    res.status(500).json({
      message: "Error while fetching student data",
      error: err.message,
    });
  }
};
