import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: String,
    standard: String,
    subjects: [String],
    parentPhone: String,
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
