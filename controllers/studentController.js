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

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, standard } = req.body;

    if (!name || !name.trim() || !standard) {
      return res.status(400).json({ message: "Name and Class Standard are required" });
    }

    const student = await Student.findOne({
      _id: id,
      isGuest: req.user.role === "guest",
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.name = name.trim();
    student.standard = standard;

    await student.save();
    res.json(student);
  } catch (err) {
    console.error("Update student error:", err);
    res.status(500).json({
      message: "Error while updating student",
      error: err.message,
    });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findOneAndDelete({
      _id: id,
      isGuest: req.user.role === "guest",
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete associated marks
    await Mark.deleteMany({
      studentId: id,
      isGuest: req.user.role === "guest",
    });

    res.json({
      message: "Student and associated marks deleted successfully",
      studentId: id,
    });
  } catch (err) {
    console.error("Delete student error:", err);
    res.status(500).json({
      message: "Error while deleting student",
      error: err.message,
    });
  }
};

