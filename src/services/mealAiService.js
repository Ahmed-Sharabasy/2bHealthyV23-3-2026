// ── AI Meal Plan Service ────────────────────────────────────
import Meal from "../models/Meal.js";
import User from "../models/User.js";
import { callAI } from "./openRouterAiService.js";
import AppError from "../utils/AppError.js";

// ── Meal categorization maps ────────────────────────────────
const BREAKFAST_CATEGORIES = new Set(["Breakfast", "Dessert", "Starter"]);
const MAIN_MEAL_CATEGORIES = new Set([
  "Chicken",
  "Beef",
  "Lamb",
  "Pork",
  "Goat",
  "Pasta",
  "Seafood",
  "Vegetarian",
  "Vegan",
  "Miscellaneous",
]);
const SIDE_CATEGORIES = new Set(["Side"]);

// Max meals to sample per pool (keeps AI prompt within token limits)
const MAX_BREAKFAST_POOL = 30;
const MAX_MAIN_POOL = 80;
const MAX_RETRY_ATTEMPTS = 2;
const MAX_MEAL_REPETITIONS = 5; // same meal max N times across 30 days

/**
 * Compute age from dateOfBirth
 */
const computeAge = (dateOfBirth) => {
  if (!dateOfBirth) return 25;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Calculate daily calories using Mifflin–St Jeor equation + goal adjustment
 */
const calculateDailyCalories = (weight, height, age, gender, fitnessGoal) => {
  let bmr;
  if (gender === "female") {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }

  // TDEE with moderate activity multiplier (1.55)
  let tdee = bmr * 1.55;

  switch (fitnessGoal) {
    case "fat_loss":
    case "weight_loss":
      tdee -= 500;
      break;
    case "muscle_gain":
      tdee += 300;
      break;
    case "weight_gain":
      tdee += 500;
      break;
    case "maintenance":
    default:
      break;
  }

  return Math.round(Math.max(1200, tdee));
};

/**
 * Calculate recommended water intake (liters)
 */
const calculateWaterLiters = (weight, fitnessGoal) => {
  let liters = Math.round((weight * 30) / 1000);

  if (["muscle_gain", "weight_gain"].includes(fitnessGoal)) {
    liters += 1;
  }

  return Math.max(3, Math.min(7, liters));
};

// ── Meal DB helpers ─────────────────────────────────────────

/**
 * Fetch all meals from DB, selecting only needed fields
 */
const fetchMealsFromDB = async () => {
  const meals = await Meal.find({})
    .select("strMeal strCategory nutrition")
    .lean();

  if (!meals || meals.length === 0) {
    throw new AppError("No meals found in database", 404);
  }

  return meals;
};

/**
 * Categorize meals into breakfast / main (lunch/dinner) pools
 */
const categorizeMeals = (meals) => {
  const breakfastPool = [];
  const mainPool = [];

  for (const meal of meals) {
    const cat = meal.strCategory;

    if (BREAKFAST_CATEGORIES.has(cat)) {
      breakfastPool.push(meal);
    }

    if (MAIN_MEAL_CATEGORIES.has(cat) || SIDE_CATEGORIES.has(cat)) {
      mainPool.push(meal);
    }

    // If category doesn't match either, still add to main pool as fallback
    if (
      !BREAKFAST_CATEGORIES.has(cat) &&
      !MAIN_MEAL_CATEGORIES.has(cat) &&
      !SIDE_CATEGORIES.has(cat)
    ) {
      mainPool.push(meal);
    }
  }

  return { breakfastPool, mainPool };
};

/**
 * Shuffle array in-place (Fisher–Yates)
 */
const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Reduce meal objects to a compact format for the AI prompt
 */
const compactMealList = (meals) => {
  return meals.map((m) => ({
    name: m.strMeal,
    cal: Math.round(m.nutrition?.calories || 0),
    p: Math.round(m.nutrition?.protein || 0),
    c: Math.round(m.nutrition?.carbs || 0),
    f: Math.round(m.nutrition?.fat || 0),
  }));
};

// ── Prompt builders ─────────────────────────────────────────

/**
 * Build the system prompt for Llama 3.1 70B (compact, strict)
 */
const buildLlamaPrompt = (goal, dailyCalories, breakfastList, mainList) => {
  const system = `You are a nutrition planning AI.

Use ONLY the provided meals for breakfast, lunch, and dinner.

Goal: ${goal}
Daily calorie target: ~${dailyCalories} kcal

Rules:
- 30-day plan
- Each day: breakfast, lunch, dinner, snacks
- breakfast MUST come from BREAKFAST_MEALS list
- lunch and dinner MUST come from MAIN_MEALS list
- Snacks can be generated freely (names only, no nutrition needed)
- Avoid repeating the same meal more than 4-5 times across 30 days
- Balance calories and macros based on goal
- Each day's totalCalories should approximate ${dailyCalories}

BREAKFAST_MEALS:
${JSON.stringify(breakfastList)}

MAIN_MEALS:
${JSON.stringify(mainList)}

Return ONLY valid JSON matching this exact schema:
{"plan":[{"day":1,"meals":{"breakfast":{"name":"","calories":0,"protein":0,"carbs":0,"fat":0},"lunch":{"name":"","calories":0,"protein":0,"carbs":0,"fat":0},"dinner":{"name":"","calories":0,"protein":0,"carbs":0,"fat":0},"snacks":["",""]},"totalCalories":0}],"averageCalories":0}`;

  return system;
};

/**
 * Build the system prompt for Gemma 4 31B (more explicit to reduce hallucination)
 */
const buildGemmaPrompt = (goal, dailyCalories, breakfastList, mainList) => {
  const system = `You MUST ONLY use meals from the provided lists below.
DO NOT create or invent new meals for breakfast, lunch, or dinner.
If a meal name is not in the lists below, DO NOT use it.

Goal: ${goal}
Daily calorie target: approximately ${dailyCalories} kcal

Plan requirements:
- Generate exactly 30 days
- Each day must have: breakfast, lunch, dinner, snacks
- breakfast MUST be selected from BREAKFAST_MEALS list only
- lunch MUST be selected from MAIN_MEALS list only
- dinner MUST be selected from MAIN_MEALS list only
- snacks can be invented freely (provide 2 snack names per day, names only)
- Avoid repeating the same meal more than 4-5 times in the entire 30-day plan
- Ensure calorie distribution matches the goal (${goal})
- Each day's totalCalories should be close to ${dailyCalories}
- Use the nutrition values (cal, p, c, f) from the provided lists

BREAKFAST_MEALS:
${JSON.stringify(breakfastList)}

MAIN_MEALS:
${JSON.stringify(mainList)}

STRICT OUTPUT FORMAT:
Return ONLY valid JSON. No text before or after. No markdown. No explanation.
The JSON must match this schema exactly:
{
  "plan": [
    {
      "day": 1,
      "meals": {
        "breakfast": { "name": "exact meal name from list", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
        "lunch": { "name": "exact meal name from list", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
        "dinner": { "name": "exact meal name from list", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
        "snacks": ["Snack Name 1", "Snack Name 2"]
      },
      "totalCalories": 0
    }
  ],
  "averageCalories": 0
}`;

  return system;
};

// ── Validation ──────────────────────────────────────────────

/**
 * Validate a single meal entry from the AI response
 * @returns {{ valid: boolean, corrected: object|null }}
 */
const validateMealEntry = (meal, validMealMap) => {
  if (!meal || !meal.name || typeof meal.name !== "string") {
    return { valid: false, corrected: null };
  }

  const name = meal.name.trim();

  // Check if meal exists in DB (case-insensitive)
  const dbMeal = validMealMap.get(name.toLowerCase());
  if (!dbMeal) {
    return { valid: false, corrected: null };
  }

  // Correct nutrition values from DB if AI hallucinated numbers
  return {
    valid: true,
    corrected: {
      name: dbMeal.strMeal, // use exact DB name
      calories: Math.round(dbMeal.nutrition?.calories || meal.calories || 0),
      protein: Math.round(dbMeal.nutrition?.protein || meal.protein || 0),
      carbs: Math.round(dbMeal.nutrition?.carbs || meal.carbs || 0),
      fat: Math.round(dbMeal.nutrition?.fat || meal.fat || 0),
    },
  };
};

/**
 * Validate the entire 30-day plan from AI
 *
 * @param {object} plan - The parsed AI response
 * @param {Map} validMealMap - Map of lowercase meal name → DB meal object
 * @returns {{ isValid: boolean, errors: string[], correctedPlan: object }}
 */
const validateMealPlan = (plan, validMealMap) => {
  const errors = [];

  // ── Structure check ─────────────────────────────────────
  if (!plan || !Array.isArray(plan.plan)) {
    return {
      isValid: false,
      errors: ["Missing or invalid 'plan' array"],
      correctedPlan: null,
    };
  }

  if (plan.plan.length < 25) {
    errors.push(`Plan has only ${plan.plan.length} days (expected 30)`);
  }

  // ── Per-day validation ──────────────────────────────────
  const mealFrequency = {};
  let totalCalories = 0;
  let invalidMealCount = 0;

  const correctedDays = [];

  for (const dayEntry of plan.plan) {
    if (!dayEntry.meals || typeof dayEntry.meals !== "object") {
      errors.push(`Day ${dayEntry.day}: missing meals object`);
      continue;
    }

    const correctedMeals = {};

    // Validate breakfast, lunch, dinner
    for (const slot of ["breakfast", "lunch", "dinner"]) {
      const meal = dayEntry.meals[slot];
      const result = validateMealEntry(meal, validMealMap);

      if (!result.valid) {
        invalidMealCount++;
        errors.push(
          `Day ${dayEntry.day} ${slot}: "${meal?.name || "empty"}" not found in DB`,
        );
        // Keep the invalid meal as-is (will be flagged)
        correctedMeals[slot] = {
          name: meal?.name || "Unknown",
          calories: Number(meal?.calories) || 0,
          protein: Number(meal?.protein) || 0,
          carbs: Number(meal?.carbs) || 0,
          fat: Number(meal?.fat) || 0,
        };
      } else {
        correctedMeals[slot] = result.corrected;

        // Track frequency
        const key = result.corrected.name.toLowerCase();
        mealFrequency[key] = (mealFrequency[key] || 0) + 1;
      }
    }

    // Validate snacks (can be freely generated, just ensure they're strings)
    let snacks = dayEntry.meals.snacks;
    if (!Array.isArray(snacks)) {
      snacks = [];
    }
    correctedMeals.snacks = snacks
      .filter((s) => s && typeof s === "string")
      .map((s) => String(s).trim())
      .slice(0, 4); // max 4 snacks per day

    if (correctedMeals.snacks.length === 0) {
      correctedMeals.snacks = ["Fresh Fruit", "Mixed Nuts"];
    }

    // Calculate day total
    const dayTotal =
      (correctedMeals.breakfast?.calories || 0) +
      (correctedMeals.lunch?.calories || 0) +
      (correctedMeals.dinner?.calories || 0);

    totalCalories += dayTotal;

    correctedDays.push({
      day: dayEntry.day || correctedDays.length + 1,
      meals: correctedMeals,
      totalCalories: Math.round(dayTotal),
    });
  }

  // ── Repetition check (soft warning) ─────────────────────
  for (const [mealName, count] of Object.entries(mealFrequency)) {
    if (count > MAX_MEAL_REPETITIONS) {
      errors.push(
        `"${mealName}" repeated ${count} times (max ${MAX_MEAL_REPETITIONS})`,
      );
    }
  }

  // ── Decision: is it valid enough? ───────────────────────
  const totalMainMeals = correctedDays.length * 3; // breakfast + lunch + dinner per day
  const invalidRatio =
    totalMainMeals > 0 ? invalidMealCount / totalMainMeals : 1;

  // If more than 30% of meals are invalid → retry
  const isValid = invalidRatio < 0.3 && correctedDays.length >= 25;

  const avgCalories =
    correctedDays.length > 0
      ? Math.round(totalCalories / correctedDays.length)
      : 0;

  return {
    isValid,
    errors,
    correctedPlan: {
      plan: correctedDays,
      averageCalories: avgCalories,
    },
  };
};

// ── Main entry point ────────────────────────────────────────

/**
 * Generate an AI-powered 30-day meal plan
 *
 * @param {string} userId - The authenticated user's _id
 * @param {object} params - Request body params
 * @param {string} params.fitness_goal
 * @param {number} params.target_weight
 * @param {string} params.target_time
 * @param {string[]} params.preferred_foods
 * @param {string[]} params.excluded_foods
 * @returns {object} The validated 30-day meal plan
 */
export const generateMealPlan = async (userId, params) => {
  const {
    fitness_goal,
    target_weight,
    target_time,
    preferred_foods = [],
    excluded_foods = [],
  } = params;

  // ── 1) Fetch user profile ─────────────────────────────────
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const age = computeAge(user.dateOfBirth);
  const currentWeight = user.weightKg || 70;
  const height = user.heightCm || 170;
  const gender = user.gender || "male";

  // ── 2) Calculate daily calories & water ───────────────────
  const dailyCalories = calculateDailyCalories(
    currentWeight,
    height,
    age,
    gender,
    fitness_goal,
  );
  const waterLiters = calculateWaterLiters(currentWeight, fitness_goal);

  // ── 3) Fetch & categorize meals from DB ───────────────────
  const allMeals = await fetchMealsFromDB();

  // Build a lookup map for validation (lowercase name → meal object)
  const validMealMap = new Map();
  for (const m of allMeals) {
    validMealMap.set(m.strMeal.toLowerCase(), m);
  }

  const { breakfastPool, mainPool } = categorizeMeals(allMeals);

  // Sample subsets to keep prompt within token limits
  const sampledBreakfast = shuffleArray([...breakfastPool]).slice(
    0,
    MAX_BREAKFAST_POOL,
  );
  const sampledMain = shuffleArray([...mainPool]).slice(0, MAX_MAIN_POOL);

  // Compact for AI prompt
  const breakfastList = compactMealList(sampledBreakfast);
  const mainList = compactMealList(sampledMain);

  console.log(
    `📦 Meal pools: ${breakfastList.length} breakfast, ${mainList.length} main`,
  );

  // ── 4) Map fitness_goal to a human-readable goal string ───
  const goalMap = {
    fat_loss: "weight loss",
    weight_loss: "weight loss",
    muscle_gain: "weight gain",
    weight_gain: "weight gain",
    maintenance: "maintenance",
  };
  const goal = goalMap[fitness_goal] || "maintenance";

  // ── 5) Build prompt & call AI (with retry on validation failure) ──
  const systemPrompt = buildLlamaPrompt(
    goal,
    dailyCalories,
    breakfastList,
    mainList,
  );
  const userMessage = `Generate the 30-day meal plan now. Goal: ${goal}, Target: ~${dailyCalories} kcal/day.`;

  let lastErrors = [];

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    console.log(
      `🍽️  Meal plan generation attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`,
    );

    try {
      const aiResponse = await callAI(systemPrompt, userMessage);

      // ── 6) Validate AI response ─────────────────────────────
      const validation = validateMealPlan(aiResponse, validMealMap);

      if (validation.errors.length > 0) {
        console.warn(
          `⚠️ Validation warnings (attempt ${attempt}):`,
          validation.errors.slice(0, 10),
        );
      }

      if (validation.isValid) {
        console.log(
          `✅ Meal plan validated successfully on attempt ${attempt}`,
        );
        return {
          dailyCalories,
          waterLiters,
          goal: fitness_goal,
          totalDays: validation.correctedPlan.plan.length,
          averageCalories: validation.correctedPlan.averageCalories,
          plan: validation.correctedPlan.plan,
        };
      }

      // Not valid enough → store errors and retry
      lastErrors = validation.errors;
      console.error(
        `❌ Validation failed (attempt ${attempt}): ${validation.errors.length} errors`,
      );
    } catch (err) {
      console.error(`❌ AI call failed (attempt ${attempt}):`, err.message);
      lastErrors = [err.message];

      // If it's the last attempt, throw
      if (attempt === MAX_RETRY_ATTEMPTS) {
        throw err;
      }
    }
  }

  // All retry attempts exhausted
  throw new AppError(
    `Failed to generate a valid meal plan after ${MAX_RETRY_ATTEMPTS} attempts. Errors: ${lastErrors.slice(0, 5).join("; ")}`,
    500,
  );
};

export default { generateMealPlan };
