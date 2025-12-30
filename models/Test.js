import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  standard: String,
  subject: String,
  testName: String,
  totalMarks: Number,
  date: Date
}, { timestamps: true });

export default mongoose.model("Test", testSchema);
