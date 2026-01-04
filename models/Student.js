import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    standard: { type: String, required: true },
    subjects: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
