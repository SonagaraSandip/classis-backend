import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    standard: { type: String, required: true },
    // subject: { type: String, required: true },
    testDate: { type: Date, required: true }, // 🔥 IMPORTANT
    // totalMarks: { type: Number, required: true },
    isGuest: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

testSchema.index({ testDate: 1, isGuest: 1 });
testSchema.index({ standard: 1, testDate: 1, isGuest: 1 });

export default mongoose.model("Test", testSchema);
