import mongoose from "mongoose";

const dailyStepsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    steps: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// ── Compound unique index — one record per user per day ─────
dailyStepsSchema.index({ user: 1, date: 1 }, { unique: true });

const DailySteps = mongoose.model("DailySteps", dailyStepsSchema);

export default DailySteps;
