// ══════════════════════════════════════════════════════════════
//  AI Endpoints Test Script — 2bHealthy
//  Run: node test_ai_endpoints.mjs
// ══════════════════════════════════════════════════════════════

const BASE = "http://localhost:5000/api/v1";

// ── Sign-in credentials ────────────────────────────────────
const SIGN_IN_DATA = {
  email: "ahmed.test@example.com",
  password: "test12345",
};

// ── Workout Plan Test Data ─────────────────────────────────
const WORKOUT_TEST_DATA = {
  fitness_goal: "muscle_gain", // fat_loss | muscle_gain | weight_gain | weight_loss | maintenance
  target_weight: 80,
  target_time: "3 months",
  workout_days: ["Monday", "Wednesday", "Friday"],
  injuries: [], // e.g. ["knee", "lower back"]
};

// ── Meal Plan Test Data ────────────────────────────────────
const MEAL_TEST_DATA = {
  fitness_goal: "fat_loss", // fat_loss | muscle_gain | weight_gain | weight_loss | maintenance
  target_weight: 70,
  target_time: "2 months",
  preferred_foods: ["chicken", "rice", "eggs"],
  excluded_foods: ["pork", "alcohol"],
};

// ══════════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════════

const log = (title) => console.log(`\n${"═".repeat(50)}\n  ${title}\n${"═".repeat(50)}`);

const postJSON = async (url, body, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
};

// ══════════════════════════════════════════════════════════════
//  Main
// ══════════════════════════════════════════════════════════════

async function main() {
  // ── 1) Sign In ────────────────────────────────────────────
  log("STEP 1: Sign In");
  console.log("POST", `${BASE}/auth/signIn`);
  console.log("Body:", JSON.stringify(SIGN_IN_DATA, null, 2));

  const signIn = await postJSON(`${BASE}/auth/signIn`, SIGN_IN_DATA);
  console.log("Status:", signIn.status);

  const token = signIn.data.token || signIn.data?.data?.token;
  if (!token) {
    console.error("❌ No token received:", JSON.stringify(signIn.data, null, 2));
    return;
  }
  console.log("✅ Token:", token.substring(0, 40) + "...");

  // ── 2) Workout Plan ──────────────────────────────────────
  log("STEP 2: AI Workout Plan");
  console.log("POST", `${BASE}/ai/workout-plan`);
  console.log("Body:", JSON.stringify(WORKOUT_TEST_DATA, null, 2));

  const workout = await postJSON(`${BASE}/ai/workout-plan`, WORKOUT_TEST_DATA, token);
  console.log("Status:", workout.status);
  console.log("Response:", JSON.stringify(workout.data, null, 2));

  // ── 3) Meal Plan ─────────────────────────────────────────
  log("STEP 3: AI Meal Plan");
  console.log("POST", `${BASE}/ai/meal-plan`);
  console.log("Body:", JSON.stringify(MEAL_TEST_DATA, null, 2));

  const meal = await postJSON(`${BASE}/ai/meal-plan`, MEAL_TEST_DATA, token);
  console.log("Status:", meal.status);
  console.log("Response:", JSON.stringify(meal.data, null, 2));

  // ── Summary ──────────────────────────────────────────────
  log("SUMMARY");
  console.log(`  Sign In:      ${signIn.status === 200 ? "✅" : "❌"} ${signIn.status}`);
  console.log(`  Workout Plan: ${workout.status === 200 ? "✅" : "❌"} ${workout.status}`);
  console.log(`  Meal Plan:    ${meal.status === 200 ? "✅" : "❌"} ${meal.status}`);
}

main().catch((e) => console.error("❌ Fatal error:", e.message));
