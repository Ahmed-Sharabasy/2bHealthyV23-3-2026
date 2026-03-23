// ── AI Workout Plan Service ─────────────────────────────────
import Exercise from "../models/Exercise.js";
import User from "../models/User.js";
import { callAI } from "./openRouterAiService.js";
import AppError from "../utils/AppError.js";

// ── Map injury keywords → body parts to avoid ──────────────
const INJURY_BODYPART_MAP = {
  knee: ["upper legs", "lower legs"],
  ankle: ["lower legs", "cardio"],
  shoulder: ["shoulders", "upper arms"],
  back: ["back"],
  "lower back": ["back", "waist"],
  wrist: ["lower arms", "upper arms"],
  hip: ["upper legs", "waist"],
  neck: ["neck"],
  elbow: ["lower arms", "upper arms"],
  chest: ["chest"],
};

/**
 * Compute age from dateOfBirth
 */
const computeAge = (dateOfBirth) => {
  if (!dateOfBirth) return 25; // default
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
 * Parse target_time string into approximate months
 */
const parseTargetMonths = (targetTime) => {
  if (!targetTime) return 3;
  const str = targetTime.toLowerCase();
  const weekMatch = str.match(/(\d+)\s*week/);
  const monthMatch = str.match(/(\d+)\s*month/);
  const yearMatch = str.match(/(\d+)\s*year/);

  if (weekMatch) return Math.max(0.25, parseInt(weekMatch[1]) / 4);
  if (monthMatch) return parseInt(monthMatch[1]);
  if (yearMatch) return parseInt(yearMatch[1]) * 12;
  return 3; // default 3 months
};

/**
 * Compute difficulty based on how aggressive the target is
 */
const computeDifficulty = (currentWeight, targetWeight, targetMonths) => {
  const weightDiff = Math.abs(targetWeight - currentWeight);
  const monthlyRate = weightDiff / targetMonths;

  // > 4 kg/month is aggressive, > 2 is moderate
  if (monthlyRate > 4) return "hard";
  if (monthlyRate > 2) return "medium";
  return "easy";
};

/**
 * Get body parts to exclude based on injuries
 */
const getExcludedBodyParts = (injuries = []) => {
  const excluded = new Set();
  for (const injury of injuries) {
    const key = injury.toLowerCase().trim();
    // Check exact match first, then partial match
    if (INJURY_BODYPART_MAP[key]) {
      INJURY_BODYPART_MAP[key].forEach((bp) => excluded.add(bp));
    } else {
      // Partial match
      for (const [injuryKey, bodyParts] of Object.entries(INJURY_BODYPART_MAP)) {
        if (key.includes(injuryKey) || injuryKey.includes(key)) {
          bodyParts.forEach((bp) => excluded.add(bp));
        }
      }
    }
  }
  return [...excluded];
};

/**
 * Build the body-part focus list based on fitness goal
 */
const getGoalBodyPartFocus = (fitnessGoal) => {
  switch (fitnessGoal) {
    case "muscle_gain":
    case "weight_gain":
      return ["chest", "back", "upper legs", "shoulders", "upper arms"];
    case "fat_loss":
    case "weight_loss":
      return ["cardio", "upper legs", "waist", "back", "chest"];
    default:
      return []; // all body parts
  }
};

/**
 * Generate an AI-powered workout plan
 *
 * @param {string} userId - The authenticated user's _id
 * @param {object} params - Request body params
 * @param {string} params.fitness_goal
 * @param {number} params.target_weight
 * @param {string} params.target_time
 * @param {string[]} params.workout_days
 * @param {string[]} [params.injuries]
 * @returns {object} The strict-JSON workout plan
 */
export const generateWorkoutPlan = async (userId, params) => {
  const { fitness_goal, target_weight, target_time, workout_days, injuries = [] } = params;

  // ── 1) Fetch user profile ─────────────────────────────────
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const age = computeAge(user.dateOfBirth);
  const currentWeight = user.weightKg || 70;
  const height = user.heightCm || 170;
  const gender = user.gender || "male";

  // ── 2) Compute difficulty ─────────────────────────────────
  const targetMonths = parseTargetMonths(target_time);
  const difficulty = computeDifficulty(currentWeight, target_weight, targetMonths);

  // ── 3) Determine exercise limits per difficulty ───────────
  const exerciseLimits = {
    easy: { perDay: 4, setsRange: [2, 3], repsRange: [10, 15] },
    medium: { perDay: 5, setsRange: [3, 4], repsRange: [8, 12] },
    hard: { perDay: 6, setsRange: [4, 5], repsRange: [6, 10] },
  };
  const limits = exerciseLimits[difficulty];

  // ── 4) Build exercise query filters ───────────────────────
  const excludedBodyParts = getExcludedBodyParts(injuries);
  const focusBodyParts = getGoalBodyPartFocus(fitness_goal);

  const query = {};
  if (excludedBodyParts.length > 0) {
    query.bodyPart = { $nin: excludedBodyParts };
  }
  if (focusBodyParts.length > 0 && excludedBodyParts.length === 0) {
    query.bodyPart = { $in: focusBodyParts };
  } else if (focusBodyParts.length > 0 && excludedBodyParts.length > 0) {
    const safeFocus = focusBodyParts.filter((bp) => !excludedBodyParts.includes(bp));
    if (safeFocus.length > 0) {
      query.bodyPart = { $in: safeFocus, $nin: excludedBodyParts };
    }
  }

  // ── 5) Fetch exercises from DB ────────────────────────────
  const maxExercises = workout_days.length * limits.perDay * 2; // fetch extra for variety
  const exercises = await Exercise.find(query)
    .select("id name bodyPart equipment target secondaryMuscles")
    .limit(maxExercises)
    .lean();

  if (exercises.length === 0) {
    throw new AppError(
      "No exercises found matching your criteria. Try adjusting injuries or goal.",
      404
    );
  }

  // ── 6) Format exercises for AI ────────────────────────────
  const exerciseList = exercises.map((e) => ({
    exerciseId: e.id,
    name: e.name,
    bodyPart: e.bodyPart,
    equipment: e.equipment,
    target: e.target,
  }));

  // ── 7) Build AI prompt ────────────────────────────────────
  const systemPrompt = `You are a professional fitness coach AI. Generate a workout plan using ONLY the exercises provided.

STRICT RULES:
1. Use ONLY exerciseId values from the provided exercise list. Do NOT invent or hallucinate exercises.
2. Output ONLY valid JSON — no markdown, no explanation, no extra text.
3. "sets" and "reps" MUST be numbers (not strings).
4. "exerciseId" MUST exactly match one from the provided list.
5. "difficulty" must be one of: "easy", "medium", "hard".
6. Schedule must use ONLY the days provided in workout_days.
7. Each day should have ${limits.perDay} exercises, targeting different body parts for variety.
8. Do NOT add any extra fields beyond what is shown in the schema.

OUTPUT SCHEMA:
{
  "schedule": ["Day1", "Day2"],
  "difficulty": "easy|medium|hard",
  "estimatedWeeklyProgress": "X kg",
  "exercises": [
    {
      "day": "Day1",
      "routines": [
        {
          "exerciseId": "string",
          "name": "string",
          "sets": number,
          "reps": number
        }
      ]
    }
  ]
}`;

  const userMessage = `USER PROFILE:
- Age: ${age}
- Gender: ${gender}
- Height: ${height} cm
- Weight: ${currentWeight} kg
- Fitness Goal: ${fitness_goal}
- Target Weight: ${target_weight} kg
- Target Time: ${target_time}
- Difficulty Level: ${difficulty}
- Workout Days: ${JSON.stringify(workout_days)}
- Injuries: ${injuries.length > 0 ? injuries.join(", ") : "None"}

Sets range: ${limits.setsRange[0]}-${limits.setsRange[1]}
Reps range: ${limits.repsRange[0]}-${limits.repsRange[1]}

AVAILABLE EXERCISES (use ONLY these):
${JSON.stringify(exerciseList, null, 2)}`;

  // ── 8) Call AI ────────────────────────────────────────────
  const plan = await callAI(systemPrompt, userMessage);

  // ── 9) Validate AI response ───────────────────────────────
  return validateWorkoutPlanResponse(plan, exercises, workout_days, difficulty);
};

/**
 * Validate and sanitize the AI workout plan response
 */
const validateWorkoutPlanResponse = (plan, dbExercises, workoutDays, difficulty) => {
  // Build a set of valid exercise IDs
  const validIds = new Set(dbExercises.map((e) => e.id));

  // Ensure schedule array
  if (!Array.isArray(plan.schedule)) {
    plan.schedule = workoutDays;
  }

  // Ensure difficulty
  if (!["easy", "medium", "hard"].includes(plan.difficulty)) {
    plan.difficulty = difficulty;
  }

  // Ensure estimatedWeeklyProgress is a string
  if (typeof plan.estimatedWeeklyProgress !== "string") {
    plan.estimatedWeeklyProgress = "0.5 kg";
  }

  // Validate exercises array
  if (!Array.isArray(plan.exercises)) {
    throw new AppError("AI returned an invalid workout plan structure", 500);
  }

  for (const dayPlan of plan.exercises) {
    if (!dayPlan.day || !Array.isArray(dayPlan.routines)) continue;

    dayPlan.routines = dayPlan.routines
      .filter((r) => r.exerciseId && validIds.has(r.exerciseId))
      .map((r) => ({
        exerciseId: r.exerciseId,
        name: String(r.name || ""),
        sets: Math.max(1, Math.min(10, parseInt(r.sets) || 3)),
        reps: Math.max(1, Math.min(30, parseInt(r.reps) || 10)),
      }));
  }

  // Return only allowed fields
  return {
    schedule: plan.schedule,
    difficulty: plan.difficulty,
    estimatedWeeklyProgress: plan.estimatedWeeklyProgress,
    exercises: plan.exercises.map((d) => ({
      day: d.day,
      routines: d.routines,
    })),
  };
};

export default { generateWorkoutPlan };
