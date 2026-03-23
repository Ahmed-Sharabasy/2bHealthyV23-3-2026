import dotenv from "dotenv";
dotenv.config({
  path: "./config.env",
});

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // MongoDB
  MONGO_URI: process.env.MONGO_URI,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  // EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
  EMAIL_PORT: process.env.EMAIL_PORT,
  // EMAIL_USER: process.env.EMAIL_USER,
  // EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_USERNAME: process.env.EMAIL_USERNAME,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@healthfit.com",

  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,

  // External APIs
  EXTERNAL_NUTRITION_API_URL: process.env.EXTERNAL_NUTRITION_API_URL,
  EXTERNAL_NUTRITION_API_KEY: process.env.EXTERNAL_NUTRITION_API_KEY,
  EXTERNAL_EXERCISE_API_URL: process.env.EXTERNAL_EXERCISE_API_URL,
  EXTERNAL_EXERCISE_API_KEY: process.env.EXTERNAL_EXERCISE_API_KEY,
};

// ── Validate critical env vars ──────────────────────────────
const requiredVars = ["MONGO_URI", "JWT_SECRET"];

for (const key of requiredVars) {
  if (!env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export default env;
