import mongoose from "mongoose";

// ── Nutrition sub-schema ────────────────────────
const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
  },
  { _id: false },
);

// ── Ingredient sub-schema ───────────────────────
const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    measure: { type: String, trim: true },
  },
  { _id: false },
);

// ── Main Meal schema ────────────────────────────
const mealSchema = new mongoose.Schema(
  {
    idMeal: {
      type: String,
      unique: true,
      required: [true, "Meal ID is required"],
    },
    strMeal: {
      type: String,
      required: [true, "Meal name is required"],
      trim: true,
    },
    strMealAlternate: { type: String, default: null },
    strCategory: {
      type: String,
      trim: true,
      required: [true, "Category is required"],
    },
    strArea: {
      type: String,
      trim: true,
    },
    strInstructions: { type: String },
    strMealThumb: { type: String },
    strTags: { type: String, default: null },
    strYoutube: { type: String, default: null },
    strSource: { type: String, default: null },
    strImageSource: { type: String, default: null },
    strCreativeCommonsConfirmed: { type: String, default: null },
    dateModified: { type: Date, default: null },

    // Cleaned & structured ingredients array
    ingredients: [ingredientSchema],

    // Embedded nutrition subdocument
    nutrition: nutritionSchema,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes for performance ─────────────────────
// Text index for full-text search on meal name
mealSchema.index({ strMeal: "text" });

// Regular indexes for filtering & sorting
mealSchema.index({ strCategory: 1 });
mealSchema.index({ strArea: 1 });
mealSchema.index({ "nutrition.calories": 1 });
mealSchema.index({ "nutrition.protein": 1 });

const Meal = mongoose.model("Meal", mealSchema);

export default Meal;
