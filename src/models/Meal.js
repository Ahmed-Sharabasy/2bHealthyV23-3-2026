import mongoose from "mongoose";
import { MEAL_TYPES, MEAL_SOURCES } from "../config/constants.js";

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Meal name is required"],
      trim: true,
    },
    calories: {
      type: Number,
      required: [true, "Calories are required"],
      min: 0,
    },
    protein: {
      type: Number,
      default: 0,
      min: 0,
    },
    carbs: {
      type: Number,
      default: 0,
      min: 0,
    },
    fats: {
      type: Number,
      default: 0,
      min: 0,
    },
    mealType: {
      type: String,
      enum: MEAL_TYPES,
      required: [true, "Meal type is required"],
    },
    source: {
      type: String,
      enum: MEAL_SOURCES,
      default: "manual",
    },
    externalId: {
      type: String,
    },
    sourceApi: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────
mealSchema.index({ name: "text" });
mealSchema.index({ externalId: 1 }, { sparse: true });

const Meal = mongoose.model("Meal", mealSchema);

export default Meal;
