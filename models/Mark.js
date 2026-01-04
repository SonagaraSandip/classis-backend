import mongoose from "mongoose";

const markSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true
    },
    obtainedMarks: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Mark", markSchema);
