import mongoose from "mongoose";

const standardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subjects: [
      {
        type: String,
        trim: true,
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

standardSchema.index({ name: 1 });
standardSchema.index({ order: 1 });

export default mongoose.model("Standard", standardSchema);
