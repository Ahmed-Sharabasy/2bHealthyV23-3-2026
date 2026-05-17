// ── Meal AI Service ─────────────────────────────────────────
import Meal from "../models/Meal.js";
import { callAI } from "./openRouterAiService.js";
import AppError from "../utils/AppError.js";

// Max meals to send to AI (keeps prompt small for free models)
const MAX_MEALS_FOR_AI = 60;

// Fields to fetch from DB for enrichment lookup
const MEAL_LOOKUP_FIELDS = "idMeal strMeal strCategory strMealThumb nutrition";

// ═══════════════════════════════════════════════════════════
//  DATABASE
// ═══════════════════════════════════════════════════════════

/**
 * Fetch meals from DB, excluding specified categories.
 * Shuffles and limits to MAX_MEALS_FOR_AI for prompt size.
 */
const fetchAndPrepareMeals = async (excludedCategories = []) => {
  const filter = {};
  if (excludedCategories.length > 0) {
    filter.strCategory = { $nin: excludedCategories };
  }

  const meals = await Meal.find(filter)
    .select("idMeal strMeal strCategory strMealThumb nutrition")
    .lean();

  if (!meals || meals.length === 0) {
    throw new AppError("No meals found in database", 404);
  }

  // Shuffle for variety
  for (let i = meals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [meals[i], meals[j]] = [meals[j], meals[i]];
  }

  // Limit to keep prompt small
  const sampled = meals.slice(0, MAX_MEALS_FOR_AI);

  // return sampled.map((m) => ({
  //   idMeal: m.idMeal,
  //   name: m.strMeal,
  //   category: m.strCategory,
  //   nutrition: {
  //     calories: Math.round(m.nutrition?.calories ?? 0),
  //     protein: Math.round(m.nutrition?.protein ?? 0),
  //     carbs: Math.round(m.nutrition?.carbs ?? 0),
  //     fat: Math.round(m.nutrition?.fat ?? 0),
  //   },
  // }));

  // For AI model that take less tokens
  return sampled.map((m) => ({
    id: m.idMeal,
    n: m.strMeal,
    c: m.strCategory,
    calories: Math.round(m.nutrition?.calories ?? 0),
    protein: Math.round(m.nutrition?.protein ?? 0),
    carbs: Math.round(m.nutrition?.carbs ?? 0),
    fat: Math.round(m.nutrition?.fat ?? 0),
  }));
};

/**
 * Parse target_time → number of days (max 30)
 */
const parseDuration = (targetTime) => {
  if (!targetTime) return 30;
  const match = targetTime.match(/(\d+)/);
  if (!match) return 30;

  const num = parseInt(match[1], 10);
  if (targetTime.toLowerCase().includes("month")) return Math.min(num * 30, 30);
  if (targetTime.toLowerCase().includes("week")) return Math.min(num * 7, 30);
  return Math.min(num, 30);
};

// ═══════════════════════════════════════════════════════════
//  PROMPTS
// ═══════════════════════════════════════════════════════════

/**
 * Build prompt — AI generates a 7-day plan, we repeat it to fill 30 days.
 * This keeps the output small enough for free models.
 */
const buildPrimaryPrompt = (params, mealsList) => {
  const system = `You are a meal planning AI.

Create a 7-day meal plan using ONLY the provided meals.

User:
Goal: ${params.fitness_goal}
Target weight: ${params.target_weight} kg
BMI : ${params.bmi}

Rules:
- Generate exactly 7 days
- breakfast, lunch, dinner: pick from meals list ONLY
- snacks: pick from Dessert category meals OR use simple names like "Fresh Fruit", "Mixed Nuts"
- DO NOT invent meals for breakfast/lunch/dinner
- Use different meals each day, minimize repetition
- Include idMeal, name, image, nutrition from the list

Meals:
${JSON.stringify(mealsList)}

Return ONLY valid JSON, no explanation:
{"plan":[{"day":1,"meals":{"breakfast":{"idMeal":"","name":"","image":"","nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0}},"lunch":{"idMeal":"","name":"","image":"","nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0}},"dinner":{"idMeal":"","name":"","image":"","nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0}},"snacks":[{"name":"","nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0}}]}}]}`;

  return {
    system,
    user: "Generate the 7-day meal plan now. JSON only.",
  };
};

const buildFallbackPrompt = (params, mealsList) => {
  const system = `Create a 7-day meal plan using ONLY these meals.
Goal: ${params.fitness_goal}, Target: ${params.target_weight} kg, BMI : ${params.bmi}.
Rules: 7 days, breakfast/lunch/dinner from list ONLY, snacks can be simple names.
Use exact idMeal, name, image, nutrition from list.
Meals: ${JSON.stringify(mealsList)}
Return ONLY JSON: {"plan":[{"day":1,"meals":{"breakfast":{"idMeal":"","name":"","image":"","nutrition":{}},"lunch":{},"dinner":{},"snacks":[{"name":""}]}}]}`;

  return {
    system,
    user: "Generate 7-day meal plan. JSON only. No text.",
  };
};

// ═══════════════════════════════════════════════════════════
//  EXPAND 7 DAYS → FULL PLAN
// ═══════════════════════════════════════════════════════════

/**
 * Take a 7-day plan and expand it to fill the requested number of days.
 * Cycles through the 7 days with slight shuffling for variety.
 */
const expandPlan = (weekPlan, totalDays) => {
  if (!weekPlan || !Array.isArray(weekPlan) || weekPlan.length === 0) {
    return weekPlan;
  }

  const fullPlan = [];
  for (let d = 0; d < totalDays; d++) {
    const sourceDay = weekPlan[d % weekPlan.length];
    fullPlan.push({
      day: d + 1,
      meals: { ...sourceDay.meals },
    });
  }
  return fullPlan;
};

// ═══════════════════════════════════════════════════════════
//  VALIDATION
// ═══════════════════════════════════════════════════════════

const validatePlan = (data) => {
  if (!data || !Array.isArray(data.plan) || data.plan.length === 0) {
    return { valid: false, reason: "Missing or empty plan array" };
  }

  for (const day of data.plan) {
    if (!day.meals) {
      return { valid: false, reason: `Day ${day.day}: missing meals` };
    }
    for (const slot of ["breakfast", "lunch", "dinner"]) {
      const meal = day.meals[slot];
      if (!meal || !meal.name) {
        return { valid: false, reason: `Day ${day.day}: empty ${slot}` };
      }
    }
  }

  return { valid: true };
};

// ═══════════════════════════════════════════════════════════
//  NUTRITION SCALING
// ═══════════════════════════════════════════════════════════

/**
 * Get a multiplier to scale per-100g DB nutrition to realistic serving sizes.
 * Adjusts total daily intake based on user's fitness goal.
 */
const getNutritionFactor = (goal) => {
  switch (goal) {
    case "weight_gain":
      return 4;

    case "maintenance":
      return 3;

    case "fat_loss":
      return 2.5;

    default:
      return 2.8;
  }
};

// ═══════════════════════════════════════════════════════════
//  ENRICHMENT
// ═══════════════════════════════════════════════════════════

/**
 * Look up a single AI meal object against DB maps.
 * Scales nutrition by the given factor to produce realistic serving values.
 * Returns enriched meal or null if not found.
 */
const matchMeal = (meal, mealType, idMap, nameMap, factor) => {
  if (!meal) return null;

  const dbMeal =
    idMap.get(meal.idMeal) ||
    idMap.get(meal.id) ||
    nameMap.get(meal.name?.toLowerCase());

  if (!dbMeal) return null;

  // Scale per-100g nutrition to realistic serving size
  const scaledNutrition = {
    calories: Math.round((dbMeal.nutrition?.calories || 0) * factor),
    protein: Math.round((dbMeal.nutrition?.protein || 0) * factor),
    carbs: Math.round((dbMeal.nutrition?.carbs || 0) * factor),
    fats: Math.round((dbMeal.nutrition?.fat || 0) * factor),
  };

  return {
    _id: dbMeal._id,
    idMeal: dbMeal.idMeal,
    strMeal: dbMeal.strMeal,
    strMealAlternate: dbMeal.strMealAlternate,
    strCategory: dbMeal.strCategory,
    strArea: dbMeal.strArea,
    strInstructions: dbMeal.strInstructions,
    strMealThumb: dbMeal.strMealThumb,
    strTags: dbMeal.strTags,
    strYoutube: dbMeal.strYoutube,
    strSource: dbMeal.strSource,
    strImageSource: dbMeal.strImageSource,
    strCreativeCommonsConfirmed: dbMeal.strCreativeCommonsConfirmed,
    ingredients: dbMeal.ingredients,
    nutrition: scaledNutrition,

    mealType,
    servings: meal.servings || 1,
  };
};

/**
 * Enrich AI meal plan with full DB data and scaled nutrition.
 *
 * The AI returns meals as an OBJECT: { breakfast, lunch, dinner, snacks }
 * This function converts each slot into a validated, enriched meal.
 * Fake / unmatched meals are filtered out.
 *
 * @param {Array}  plan       - AI plan array [{day, meals:{breakfast,lunch,dinner,snacks}}]
 * @param {Map}    idMap      - Map<idMeal, dbMealDoc>
 * @param {Map}    nameMap    - Map<lowerCaseName, dbMealDoc>
 * @param {string} fitnessGoal - User's fitness goal for nutrition scaling
 * @returns {Array} Enriched plan with validated meals array per day
 */
const enrichMealPlan = (plan, idMap, nameMap, fitnessGoal) => {
  const MAIN_SLOTS = ["breakfast", "lunch", "dinner"];
  const factor = getNutritionFactor(fitnessGoal);

  console.log(`⚖️  Nutrition factor: ${factor}x (goal: ${fitnessGoal})`);

  return plan.map((day) => {
    const enrichedMeals = [];

    // Handle main meal slots (each is a single object)
    for (const slot of MAIN_SLOTS) {
      const meal = day.meals?.[slot];
      const enriched = matchMeal(meal, slot, idMap, nameMap, factor);
      if (enriched) enrichedMeals.push(enriched);
    }

    // Handle snacks (array of objects, may not exist in DB)
    const snacks = day.meals?.snacks;
    if (Array.isArray(snacks)) {
      for (const snack of snacks) {
        const enriched = matchMeal(snack, "snack", idMap, nameMap, factor);
        if (enriched) enrichedMeals.push(enriched);
      }
    }

    return {
      day: day.day,
      meals: enrichedMeals,
    };
  });
};

// ═══════════════════════════════════════════════════════════
//  MAIN ENTRY
// ═══════════════════════════════════════════════════════════

/**
 * Generate AI meal plan.
 */
export const generateMealPlan = async (bmi, params) => {
  const {
    fitness_goal,
    target_weight,
    target_time,
    excluded_foods = [],
  } = params;

  const totalDays = parseDuration(target_time);

  // 1) Fetch meals for AI prompt
  const meals = await fetchAndPrepareMeals(excluded_foods);
  console.log(
    `📦 ${meals.length} meals loaded (excluded: ${excluded_foods.join(", ") || "none"})`,
  );

  // 2) Build lookup maps for enrichment (use full DB docs)
  const filter = {};
  if (excluded_foods.length > 0) {
    filter.strCategory = { $nin: excluded_foods };
  }
  // const allDbMeals = await Meal.find(filter).select(MEAL_LOOKUP_FIELDS).lean();
  const allDbMeals = await Meal.find(filter).lean();

  const idMap = new Map();
  const nameMap = new Map();
  for (const m of allDbMeals) {
    idMap.set(m.idMeal, m);
    nameMap.set(m.strMeal.toLowerCase(), m);
  }
  console.log(
    `🗂️  Lookup maps built: ${idMap.size} by ID, ${nameMap.size} by name`,
  );

  // 3) Build prompts (AI generates 7 days, we expand to totalDays)
  const promptParams = { bmi, fitness_goal, target_weight };
  const prompts = {
    primary: buildPrimaryPrompt(promptParams, meals),
    fallback: buildFallbackPrompt(promptParams, meals),
  };

  // 4) Call AI
  console.log(
    `🍽️ Generating 7-day base plan (will expand to ${totalDays} days)...`,
  );
  const aiResponse = await callAI(prompts);

  // 5) Validate
  const check = validatePlan(aiResponse);
  if (!check.valid) {
    console.error(`❌ Validation failed: ${check.reason}`);
    console.log(`🔄 Retrying with fallback...`);

    const retryResponse = await callAI({
      primary: prompts.fallback,
      fallback: prompts.fallback,
    });

    const retryCheck = validatePlan(retryResponse);
    if (!retryCheck.valid) {
      throw new AppError(
        `Invalid meal plan after retry: ${retryCheck.reason}`,
        500,
      );
    }

    retryResponse.plan = expandPlan(retryResponse.plan, totalDays);
    retryResponse.plan = enrichMealPlan(
      retryResponse.plan,
      idMap,
      nameMap,
      fitness_goal,
    );
    return retryResponse;
  }

  // 6) Expand 7-day plan to full duration
  aiResponse.plan = expandPlan(aiResponse.plan, totalDays);

  // 7) Enrich with full DB data (filter out fake AI meals)
  aiResponse.plan = enrichMealPlan(
    aiResponse.plan,
    idMap,
    nameMap,
    fitness_goal,
  );
  console.log(`✅ Expanded & enriched: ${aiResponse.plan.length} days`);

  return aiResponse;
};

export default { generateMealPlan };
