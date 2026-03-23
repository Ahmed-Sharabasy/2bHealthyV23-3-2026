import mongoose from "mongoose";
import { MEAL_TYPES } from "../config/constants.js";

const dailyMealLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealPlan",
    },
    dayIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    meals: [
      {
        meal: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Meal",
          required: true,
        },
        mealType: {
          type: String,
          enum: MEAL_TYPES,
          required: true,
        },
        portionSize: {
          type: Number,
          default: 1,
          min: 0.1,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────
dailyMealLogSchema.index({ user: 1, createdAt: -1 });
dailyMealLogSchema.index({ mealPlan: 1, dayIndex: 1 });

const DailyMealLog = mongoose.model("DailyMealLog", dailyMealLogSchema);

export default DailyMealLog;
