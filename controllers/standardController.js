import mongoose from "mongoose";
import Standard from "../models/Standard.js";
import { subjectsByStandard as defaultSubjects } from "../config/subjectsByStandard.js";

// Helper to seed default standards if database is empty
export const seedDefaultsIfNeeded = async () => {
  try {
    const count = await Standard.countDocuments();
    if (count === 0) {
      const defaultEntries = Object.entries(defaultSubjects).map(([name, subjects], index) => ({
        name,
        subjects: Array.isArray(subjects) ? subjects : [],
        order: index,
      }));
      await Standard.insertMany(defaultEntries);
      console.log("✅ Seeded default standards & subjects into database");
    }
  } catch (seedErr) {
    console.error("Error seeding default standards:", seedErr);
  }
};

// Helper to find a standard by ID or by name
const findStandardByIdOrName = async (id, standardName) => {
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    const std = await Standard.findById(id);
    if (std) return std;
  }
  if (standardName) {
    const std = await Standard.findOne({ name: standardName });
    if (std) return std;
  }
  return null;
};

// 1️⃣ Get all standards with their subjects
export const getStandards = async (req, res) => {
  try {
    await seedDefaultsIfNeeded();
    const standards = await Standard.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json(standards);
  } catch (err) {
    console.error("Error fetching standards:", err);
    res.status(500).json({ message: "Failed to fetch standards", error: err.message });
  }
};

// 2️⃣ Create a new standard
export const createStandard = async (req, res) => {
  try {
    const { name, subjects } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "ધોરણનું નામ જરૂરી છે (Standard name is required)" });
    }

    const trimmedName = name.trim();
    const existing = await Standard.findOne({ name: trimmedName });
    if (existing) {
      return res.status(400).json({ message: "આ ધોરણ પહેલેથી જ અસ્તિત્વમાં છે (Standard already exists)" });
    }

    const cleanSubjects = Array.isArray(subjects)
      ? subjects.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
      : [];

    const count = await Standard.countDocuments();
    const newStandard = await Standard.create({
      name: trimmedName,
      subjects: [...new Set(cleanSubjects)],
      order: count,
    });

    res.status(201).json(newStandard);
  } catch (err) {
    console.error("Error creating standard:", err);
    res.status(500).json({ message: "Failed to create standard", error: err.message });
  }
};

// 3️⃣ Add subject(s) to a standard
export const addSubjectToStandard = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, standardName } = req.body;

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ message: "વિષયનું નામ જરૂરી છે (Subject name is required)" });
    }

    const trimmedSubject = subject.trim();
    let standard = await findStandardByIdOrName(id, standardName);

    if (!standard && standardName) {
      // Seed this standard if not yet in database
      const defaultSubs = defaultSubjects[standardName] || [];
      standard = await Standard.create({
        name: standardName,
        subjects: defaultSubs,
        order: await Standard.countDocuments(),
      });
    }

    if (!standard) {
      return res.status(404).json({ message: "ધોરણ મળ્યું નથી (Standard not found)" });
    }

    if (standard.subjects.includes(trimmedSubject)) {
      return res.status(400).json({ message: "આ વિષય પહેલેથી ઉમેરાયેલ છે (Subject already exists)" });
    }

    standard.subjects.push(trimmedSubject);
    await standard.save();

    res.json(standard);
  } catch (err) {
    console.error("Error adding subject:", err);
    res.status(500).json({ message: "Failed to add subject", error: err.message });
  }
};

// 4️⃣ Remove subject from standard
export const removeSubjectFromStandard = async (req, res) => {
  try {
    const { id, subject } = req.params;
    const { standardName } = req.query;

    const decodedSubject = decodeURIComponent(subject);
    let standard = await findStandardByIdOrName(id, standardName);

    if (!standard && standardName) {
      const defaultSubs = defaultSubjects[standardName] || [];
      standard = await Standard.create({
        name: standardName,
        subjects: defaultSubs.filter((s) => s !== decodedSubject),
        order: await Standard.countDocuments(),
      });
      return res.json(standard);
    }

    if (!standard) {
      return res.status(404).json({ message: "ધોરણ મળ્યું નથી (Standard not found)" });
    }

    standard.subjects = standard.subjects.filter((s) => s !== decodedSubject);
    await standard.save();

    res.json(standard);
  } catch (err) {
    console.error("Error removing subject:", err);
    res.status(500).json({ message: "Failed to remove subject", error: err.message });
  }
};

// 5️⃣ Delete standard
export const deleteStandard = async (req, res) => {
  try {
    const { id } = req.params;
    const { standardName } = req.query;

    let standard = await findStandardByIdOrName(id, standardName);
    if (!standard) {
      return res.status(404).json({ message: "ધોરણ મળ્યું નથી (Standard not found)" });
    }

    await Standard.findByIdAndDelete(standard._id);
    res.json({ message: "Standard deleted successfully", id: standard._id });
  } catch (err) {
    console.error("Error deleting standard:", err);
    res.status(500).json({ message: "Failed to delete standard", error: err.message });
  }
};
