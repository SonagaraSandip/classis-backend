import mongoose from "mongoose";

const markSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
  obtainedMarks: Number,
  pdfUrl: String
}, { timestamps: true });

export default mongoose.model("Mark", markSchema);
