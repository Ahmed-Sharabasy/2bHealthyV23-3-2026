import mongoose from "mongoose";
import { GOAL_TYPES } from "../config/constants.js";

const workoutPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    goalType: {
      type: String,
      enum: GOAL_TYPES,
      required: [true, "Goal type is required"],
    },
    durationWeeks: {
      type: Number,
      required: [true, "Duration in weeks is required"],
      min: 1,
      max: 52,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────
workoutPlanSchema.index({ user: 1, isActive: 1 });

const WorkoutPlan = mongoose.model("WorkoutPlan", workoutPlanSchema);

export default WorkoutPlan;
