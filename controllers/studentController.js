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
    const student = await Student.findOne({
      _id: id,
      isGuest: req.user.role === "guest",
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 2️⃣ Get marks history
    const marks = await Mark.find({
      studentId: id,
      isGuest: req.user.role === "guest",
    }).populate("testId", "testDate standard");

    // 3️⃣ Sort history chronologically by test date descending
    const sortedMarks = marks.sort((a, b) => {
      const dateA = a.testId?.testDate ? new Date(a.testId.testDate).getTime() : 0;
      const dateB = b.testId?.testDate ? new Date(b.testId.testDate).getTime() : 0;
      return dateB - dateA;
    });

    const history = sortedMarks.map((m) => ({
      markId: m._id,
      testDate: m.testId?.testDate,
      standard: m.testId?.standard || student.standard,
      subject: m.subject,
      totalMarks: m.totalMarks,
      obtainedMarks: m.obtainedMarks,
      status: m.status,
      percentage:
        m.status === "PRESENT" && m.totalMarks > 0 && Number.isFinite(m.obtainedMarks)
          ? Math.round((m.obtainedMarks / m.totalMarks) * 100)
          : null,
    }));

    // 4️⃣ Calculate stats
    const totalTests = history.length;
    const presentCount = history.filter((r) => r.status === "PRESENT").length;
    const absentCount = totalTests - presentCount;
    const attendancePercentage = totalTests > 0 ? Math.round((presentCount / totalTests) * 100) : 0;

    let totalPossible = 0;
    let totalObtained = 0;
    const subjectMap = {};

    history.forEach((row) => {
      if (row.status === "PRESENT" && Number.isFinite(row.obtainedMarks)) {
        totalPossible += row.totalMarks || 0;
        totalObtained += row.obtainedMarks || 0;

        if (!subjectMap[row.subject]) {
          subjectMap[row.subject] = { total: 0, obtained: 0, count: 0 };
        }
        subjectMap[row.subject].total += row.totalMarks || 0;
        subjectMap[row.subject].obtained += row.obtainedMarks || 0;
        subjectMap[row.subject].count += 1;
      }
    });

    const overallPercentage = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : null;

    const stats = {
      totalTests,
      presentCount,
      absentCount,
      attendancePercentage,
      totalPossible,
      totalObtained,
      overallPercentage,
    };

    res.json({
      student,
      history,
      stats,
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

