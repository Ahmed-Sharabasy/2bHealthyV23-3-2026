import mongoose from "mongoose";
import { GOAL_TYPES } from "../config/constants.js";

const mealPlanSchema = new mongoose.Schema(
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
    caloriesTarget: {
      type: Number,
      required: true,
      min: 0,
    },
    proteinTarget: {
      type: Number,
      default: 0,
      min: 0,
    },
    carbsTarget: {
      type: Number,
      default: 0,
      min: 0,
    },
    fatsTarget: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    aiModel: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────
mealPlanSchema.index({ user: 1, isActive: 1 });

const MealPlan = mongoose.model("MealPlan", mealPlanSchema);

export default MealPlan;
