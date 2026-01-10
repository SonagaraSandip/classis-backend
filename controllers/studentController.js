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
  const { standard, subject } = req.query;

  const filter = {};
  if (standard) filter.standard = standard;
  if (subject) filter.subjects = subject;

  const students = await Student.find({
    ...filter,
    isGuest: req.user.role === "guest",
  });
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

    const tests = await Test.find({ standard: student.standard }).sort({
      testDate: -1,
    });

    // 2️⃣ Get marks history (FIXED SORT)
    const marks = await Mark.find({ studentId: id });

    //merge mark + absent
    const history = tests.map((test) => {
      const mark = marks.find(
        (m) => m.testId.toString() === test._id.toString()
      );

      return {
        testDate: test.testDate,
        subject: test.subject,
        totalMarks: test.totalMarks,
        obtainedMarks: mark ? mark.obtainedMarks : null,
        status: mark ? mark.status : "ABSENT",
      };
    });

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
