import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    standard: { type: String, required: true },
    isGuest: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

studentSchema.index({ standard: 1, isGuest: 1, name: 1 });

export default mongoose.model("Student", studentSchema);
