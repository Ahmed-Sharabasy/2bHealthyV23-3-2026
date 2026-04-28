// ── Workout AI Service ──────────────────────────────────────
import Exercise from "../models/Exercise.js";
import { callAI } from "./openRouterAiService.js";
import AppError from "../utils/AppError.js";

const MAX_EXERCISES_PER_BODYPART = 10;

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Parse target_time string → number of days.
 * "1 months" → 30, "2 weeks" → 14, "10 days" → 10
 */
const parseDuration = (targetTime) => {
  if (!targetTime) return 30;
  const match = targetTime.match(/(\d+)/);
  if (!match) return 30;
  const num = parseInt(match[1], 10);
  const lower = targetTime.toLowerCase();
  if (lower.includes("month")) return num * 30;
  if (lower.includes("week")) return num * 7;
  return num;
};

/**
 * Shuffle array in-place (Fisher-Yates).
 */
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ═══════════════════════════════════════════════════════════
//  DATABASE
// ═══════════════════════════════════════════════════════════

/**
 * Fetch exercises from DB, excluding injured muscle targets.
 * Filters both primary target and secondaryMuscles.
 */
const fetchExercises = async (injuries = []) => {
  const filter = {};
  const injuredLower = injuries.map((i) => i.toLowerCase());

  if (injuredLower.length > 0) {
    filter.target = { $nin: injuredLower };
    filter.secondaryMuscles = { $nin: injuredLower };
  }

  const exercises = await Exercise.find(filter)
    .select("id name bodyPart target equipment gifUrl cloudinaryGifUrl")
    .lean();

  if (!exercises || exercises.length === 0) {
    throw new AppError("No exercises found after filtering injuries", 404);
  }

  return exercises;
};

/**
 * Sample exercises per bodyPart for token efficiency.
 * Returns a shuffled subset limited per body part.
 */
const sampleExercises = (exercises) => {
  const grouped = {};
  for (const ex of exercises) {
    if (!grouped[ex.bodyPart]) grouped[ex.bodyPart] = [];
    grouped[ex.bodyPart].push(ex);
  }

  const sampled = [];
  for (const exs of Object.values(grouped)) {
    shuffle(exs);
    sampled.push(...exs.slice(0, MAX_EXERCISES_PER_BODYPART));
  }

  return sampled;
};

// ═══════════════════════════════════════════════════════════
//  PROMPTS
// ═══════════════════════════════════════════════════════════

/**
 * Build compact exercise list for AI (omit gifUrl to save tokens).
 */
const toCompactList = (exercises) =>
  exercises.map((e) => ({
    id: e.id,
    name: e.name,
    bodyPart: e.bodyPart,
    target: e.target,
    equipment: e.equipment,
  }));

/**
 * Goal-specific rep/set guidance (one-liner for prompt).
 */
const goalHint = (goal) => {
  const hints = {
    muscle_gain: "Heavy weight, 3-5 sets, 8-12 reps",
    fat_loss: "Moderate weight, 3-4 sets, 12-15 reps, short rest",
    weight_loss: "Light-moderate weight, 3-4 sets, 12-15 reps",
    weight_gain: "Heavy weight, 4-5 sets, 6-10 reps",
    maintenance: "Moderate weight, 3 sets, 10-12 reps",
  };
  return hints[goal] || hints.maintenance;
};

const buildPrimaryPrompt = (params, exerciseList) => {
  const system = `You are a workout planning AI. Return ONLY valid JSON.

Create a workout plan using ONLY exercises from the provided list.

User info:
- Goal: ${params.fitness_goal}
- Days: ${params.workout_days.join(", ")}
- Style: ${goalHint(params.fitness_goal)}

Rules:
- One entry per workout day
- 4-6 exercises per day
- Reference exercises by "id" from the list
- Assign sets and reps based on goal
- Choose a logical focus bodyPart per day
- Minimize exercise repetition across days

Exercises:
${JSON.stringify(exerciseList)}

Return ONLY this JSON:
{"plan":[{"day":"Monday","focus":"chest","exercises":[{"id":"0001","sets":3,"reps":"10-12"}]}]}`;

  return {
    system,
    user: "Generate the workout plan now. JSON only.",
  };
};

const buildFallbackPrompt = (params, exerciseList) => {
  const system = `Create workout plan. JSON only. Use ONLY exercises from list by "id".
Goal: ${params.fitness_goal}. Days: ${params.workout_days.join(", ")}.
Style: ${goalHint(params.fitness_goal)}.
4-6 exercises/day. Assign sets and reps. Pick focus per day.
Exercises: ${JSON.stringify(exerciseList)}
Format: {"plan":[{"day":"Monday","focus":"chest","exercises":[{"id":"0001","sets":3,"reps":"10-12"}]}]}`;

  return {
    system,
    user: "Generate workout plan. JSON only. No text.",
  };
};

// ═══════════════════════════════════════════════════════════
//  VALIDATION & ENRICHMENT
// ═══════════════════════════════════════════════════════════

/**
 * Validate AI response structure.
 */
const validatePlan = (data) => {
  if (!data || !Array.isArray(data.plan) || data.plan.length === 0) {
    return { valid: false, reason: "Missing or empty plan array" };
  }

  for (const day of data.plan) {
    if (!day.day || !day.focus) {
      return { valid: false, reason: "Day missing 'day' or 'focus'" };
    }
    if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
      return { valid: false, reason: `${day.day}: no exercises` };
    }
  }

  return { valid: true };
};

/**
 * Enrich AI plan with full exercise details from DB.
 * Matches by exercise ID, falls back to name matching.
 */
const enrichPlan = (plan, idMap, nameMap) => {
  return plan.map((day) => ({
    day: day.day,
    focus: day.focus,
    exercises: day.exercises
      .map((ex) => {
        const dbEx = idMap.get(ex.id) || nameMap.get(ex.name?.toLowerCase());
        if (dbEx) {
          return {
            id: dbEx.id,
            name: dbEx.name,
            target: dbEx.target,
            equipment: dbEx.equipment,
            gifUrl: dbEx.cloudinaryGifUrl || dbEx.gifUrl,
            sets: ex.sets || 3,
            reps: ex.reps || "10-12",
          };
        }
        // Skip exercises not found in DB (avoid fake data)
        return null;
      })
      .filter(Boolean),
  }));
};

// ═══════════════════════════════════════════════════════════
//  MAIN ENTRY
// ═══════════════════════════════════════════════════════════

/**
 * Generate AI workout plan.
 */
export const generateWorkoutPlan = async (userId, params) => {
  const {
    fitness_goal,
    target_weight,
    target_time,
    workout_days,
    injuries = [],
  } = params;

  const durationDays = parseDuration(target_time);

  // 1) Fetch exercises (injuries filtered out)
  const allExercises = await fetchExercises(injuries);
  console.log(
    `💪 ${allExercises.length} exercises loaded (injuries excluded: ${injuries.join(", ") || "none"})`,
  );

  // 2) Sample for token efficiency
  const sampled = sampleExercises(allExercises);
  console.log(`📋 ${sampled.length} exercises sampled for AI`);

  // 3) Build lookup maps for enrichment
  const idMap = new Map();
  const nameMap = new Map();
  for (const ex of allExercises) {
    idMap.set(ex.id, ex);
    nameMap.set(ex.name.toLowerCase(), ex);
  }

  // 4) Build prompts
  const compactList = toCompactList(sampled);
  const promptParams = {
    fitness_goal,
    target_weight,
    workout_days,
    duration_days: durationDays,
  };
  const prompts = {
    primary: buildPrimaryPrompt(promptParams, compactList),
    fallback: buildFallbackPrompt(promptParams, compactList),
  };

  // 5) Call AI
  console.log(
    `🏋️ Generating workout plan for ${workout_days.length} days (${durationDays}-day program)...`,
  );
  const aiResponse = await callAI(prompts);

  // 6) Validate
  const check = validatePlan(aiResponse);
  if (!check.valid) {
    console.error(`❌ Validation failed: ${check.reason}`);
    console.log(`🔄 Retrying...`);

    const retryResponse = await callAI({
      primary: prompts.fallback,
      fallback: prompts.fallback,
    });

    const retryCheck = validatePlan(retryResponse);
    if (!retryCheck.valid) {
      throw new AppError(
        `Invalid workout plan after retry: ${retryCheck.reason}`,
        500,
      );
    }

    retryResponse.plan = enrichPlan(retryResponse.plan, idMap, nameMap);
    return retryResponse;
  }

  // 7) Enrich with full DB data
  aiResponse.plan = enrichPlan(aiResponse.plan, idMap, nameMap);
  console.log(`✅ Workout plan ready: ${aiResponse.plan.length} days`);

  return aiResponse;
};

export default { generateWorkoutPlan };
