// ── AI Meal Plan Service ────────────────────────────────────
import User from "../models/User.js";
import { callAI } from "./openRouterAiService.js";
import AppError from "../utils/AppError.js";

const SPOONACULAR_BASE = "https://api.spoonacular.com";

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
  // Mifflin–St Jeor BMR
  let bmr;
  if (gender === "female") {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }

  // TDEE with moderate activity multiplier (1.55)
  let tdee = bmr * 1.55;

  // Adjust for goal
  switch (fitnessGoal) {
    case "fat_loss":
    case "weight_loss":
      tdee -= 500; // caloric deficit
      break;
    case "muscle_gain":
      tdee += 300; // slight surplus
      break;
    case "weight_gain":
      tdee += 500; // bigger surplus
      break;
    case "maintenance":
    default:
      break; // no adjustment
  }

  return Math.round(Math.max(1200, tdee)); // minimum 1200 kcal
};

/**
 * Calculate recommended water intake (liters)
 */
const calculateWaterLiters = (weight, fitnessGoal) => {
  // Base: ~30ml per kg of body weight
  let liters = Math.round((weight * 30) / 1000);

  // Active / muscle gain goals need more water
  if (["muscle_gain", "weight_gain"].includes(fitnessGoal)) {
    liters += 1;
  }

  // Clamp between 3 and 7
  return Math.max(3, Math.min(7, liters));
};

/**
 * Fetch meal suggestions from Spoonacular
 */
const fetchSpoonacularMeals = async (dailyCalories, excludedFoods) => {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    throw new AppError("Spoonacular API key is not configured", 500);
  }

  try {
    // Use meal planner to get a day's worth of meals
    const planUrl = `${SPOONACULAR_BASE}/mealplanner/generate?apiKey=${apiKey}&timeFrame=day&targetCalories=${dailyCalories}`;
    const planResponse = await fetch(planUrl);

    if (!planResponse.ok) {
      throw new Error(`Spoonacular mealplanner responded with status ${planResponse.status}`);
    }

    const planData = await planResponse.json();
    const mealIds = (planData.meals || []).map((m) => m.id);

    // Also search for more recipes for variety
    const excludeQuery = excludedFoods.length > 0
      ? `&excludeIngredients=${excludedFoods.join(",")}`
      : "";
    const searchUrl = `${SPOONACULAR_BASE}/recipes/complexSearch?apiKey=${apiKey}&addRecipeNutrition=true&number=12&sort=healthiness${excludeQuery}&targetCalories=${Math.round(dailyCalories / 3)}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      throw new Error(`Spoonacular search responded with status ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    // Fetch info for meal plan recipes
    const mealDetails = [];
    for (const id of mealIds) {
      try {
        const infoUrl = `${SPOONACULAR_BASE}/recipes/${id}/information?apiKey=${apiKey}&includeNutrition=true`;
        const infoRes = await fetch(infoUrl);
        if (infoRes.ok) {
          mealDetails.push(await infoRes.json());
        }
      } catch {
        // skip individual failures
      }
    }

    // Combine & format all recipes
    const allRecipes = [
      ...mealDetails.map(formatRecipeDetail),
      ...(searchData.results || []).map(formatSearchResult),
    ];

    return allRecipes;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Failed to fetch meals from Spoonacular: ${err.message}`, 502);
  }
};

/**
 * Format a recipe detail response
 */
const formatRecipeDetail = (recipe) => {
  const nutrients = recipe.nutrition?.nutrients || [];
  return {
    title: recipe.title || "Unknown",
    calories: Math.round(findNutrient(nutrients, "Calories") || 0),
    protein: Math.round(findNutrient(nutrients, "Protein") || 0),
    fat: Math.round(findNutrient(nutrients, "Fat") || 0),
    carbs: Math.round(findNutrient(nutrients, "Carbohydrates") || 0),
    servings: recipe.servings || 1,
    readyInMinutes: recipe.readyInMinutes || 30,
    dishTypes: recipe.dishTypes || [],
  };
};

/**
 * Format a search result recipe
 */
const formatSearchResult = (recipe) => {
  const nutrients = recipe.nutrition?.nutrients || [];
  return {
    title: recipe.title || "Unknown",
    calories: Math.round(findNutrient(nutrients, "Calories") || 0),
    protein: Math.round(findNutrient(nutrients, "Protein") || 0),
    fat: Math.round(findNutrient(nutrients, "Fat") || 0),
    carbs: Math.round(findNutrient(nutrients, "Carbohydrates") || 0),
    servings: recipe.servings || 1,
    readyInMinutes: recipe.readyInMinutes || 30,
    dishTypes: recipe.dishTypes || [],
  };
};

/**
 * Find a nutrient by name
 */
const findNutrient = (nutrients, name) => {
  const n = nutrients.find((n) => n.name === name);
  return n ? n.amount : 0;
};

/**
 * Generate an AI-powered meal plan
 *
 * @param {string} userId - The authenticated user's _id
 * @param {object} params - Request body params
 * @param {string} params.fitness_goal
 * @param {number} params.target_weight
 * @param {string} params.target_time
 * @param {string[]} params.preferred_foods
 * @param {string[]} params.excluded_foods
 * @returns {object} The strict-JSON meal plan
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
  const dailyCalories = calculateDailyCalories(currentWeight, height, age, gender, fitness_goal);
  const waterLiters = calculateWaterLiters(currentWeight, fitness_goal);

  // ── 3) Fetch meals from Spoonacular ───────────────────────
  const spoonacularMeals = await fetchSpoonacularMeals(dailyCalories, excluded_foods);

  // ── 4) Build AI prompt ────────────────────────────────────
  const systemPrompt = `You are a professional nutritionist AI. Generate a personalized daily meal plan.

STRICT RULES:
1. Output ONLY valid JSON — no markdown, no explanation, no extra text.
2. Prefer foods from the preferred_foods list when possible.
3. STRICTLY AVOID any food from the excluded_foods list. Never include them.
4. Other foods not in either list are allowed normally.
5. Provide EXACTLY 3 options for each meal type: breakfast, lunch, dinner, snacks.
6. "dailyCalories" must be a number.
7. "waterLiters" must be a number between 3 and 7.
8. Each meal option must have "name" (string) and "foods" (array of strings).
9. Do NOT add any extra fields beyond what is shown in the schema.
10. Meals must be balanced — consider calories, protein, and fats.
11. Total calories across all meals in a day should approximate the dailyCalories target.

OUTPUT SCHEMA:
{
  "dailyCalories": number,
  "waterLiters": number,
  "meals": {
    "breakfast": [
      { "name": "Meal 1", "foods": ["food1", "food2"] },
      { "name": "Meal 2", "foods": [] },
      { "name": "Meal 3", "foods": [] }
    ],
    "lunch": [
      { "name": "Meal 1", "foods": [] },
      { "name": "Meal 2", "foods": [] },
      { "name": "Meal 3", "foods": [] }
    ],
    "dinner": [
      { "name": "Meal 1", "foods": [] },
      { "name": "Meal 2", "foods": [] },
      { "name": "Meal 3", "foods": [] }
    ],
    "snacks": [
      { "name": "Snack 1", "foods": [] },
      { "name": "Snack 2", "foods": [] },
      { "name": "Snack 3", "foods": [] }
    ]
  }
}`;

  const userMessage = `USER PROFILE:
- Age: ${age}
- Gender: ${gender}
- Height: ${height} cm
- Current Weight: ${currentWeight} kg
- Target Weight: ${target_weight} kg
- Fitness Goal: ${fitness_goal}
- Target Time: ${target_time}
- Calculated Daily Calories: ${dailyCalories}
- Calculated Water Intake: ${waterLiters} liters

PREFERRED FOODS: ${preferred_foods.length > 0 ? preferred_foods.join(", ") : "None specified"}
EXCLUDED FOODS (MUST AVOID): ${excluded_foods.length > 0 ? excluded_foods.join(", ") : "None"}

REFERENCE RECIPES FROM DATABASE (use these as inspiration):
${JSON.stringify(spoonacularMeals, null, 2)}

Generate a complete daily meal plan following the strict schema. Make sure each meal is realistic, nutritionally balanced, and respects the user's preferences.`;

  // ── 5) Call AI ────────────────────────────────────────────
  const plan = await callAI(systemPrompt, userMessage);

  // ── 6) Validate AI response ───────────────────────────────
  return validateMealPlanResponse(plan, dailyCalories, waterLiters);
};

/**
 * Validate and sanitize the AI meal plan response
 */
const validateMealPlanResponse = (plan, expectedCalories, expectedWater) => {
  // Ensure dailyCalories
  if (typeof plan.dailyCalories !== "number" || plan.dailyCalories < 1000) {
    plan.dailyCalories = expectedCalories;
  }
  plan.dailyCalories = Math.round(plan.dailyCalories);

  // Ensure waterLiters
  if (typeof plan.waterLiters !== "number" || plan.waterLiters < 3) {
    plan.waterLiters = expectedWater;
  }
  plan.waterLiters = Math.max(3, Math.min(7, Math.round(plan.waterLiters)));

  // Validate meals structure
  if (!plan.meals || typeof plan.meals !== "object") {
    throw new AppError("AI returned an invalid meal plan structure", 500);
  }

  const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];
  for (const type of mealTypes) {
    if (!Array.isArray(plan.meals[type])) {
      plan.meals[type] = [];
    }

    // Ensure exactly 3 options
    plan.meals[type] = plan.meals[type].slice(0, 3);

    // Pad if less than 3
    while (plan.meals[type].length < 3) {
      plan.meals[type].push({
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Option ${plan.meals[type].length + 1}`,
        foods: [],
      });
    }

    // Sanitize each meal option
    plan.meals[type] = plan.meals[type].map((meal) => ({
      name: String(meal.name || "Unnamed Meal"),
      foods: Array.isArray(meal.foods)
        ? meal.foods.map((f) => String(f))
        : [],
    }));
  }

  // Return only allowed fields
  return {
    dailyCalories: plan.dailyCalories,
    waterLiters: plan.waterLiters,
    meals: {
      breakfast: plan.meals.breakfast,
      lunch: plan.meals.lunch,
      dinner: plan.meals.dinner,
      snacks: plan.meals.snacks,
    },
  };
};

export default { generateMealPlan };
