import Student from "../models/Student.js";

export const addStudent = async (req, res) => {
  try {
    const { name, standard, subjects, parentPhone } = req.body;

    if (!name || !standard || !subjects) {
      return res.status(400).json({ message: "Required Field missing" });
    }

    const student = new Student({
      name,
      standard,
      subjects,
      parentPhone,
    });

    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getStudentByFilter = async (req, res) => {
  try {
    const { standard, subject } = req.query;

    if (!standard || !subject) {
      return res.status(400).json({ message: "Standard and subject required" });
    }

    const students = await Student.find({
      standard,
      subjects: { $in: [subject] },
    }).sort({ name: 1 });

    res.json(students);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
