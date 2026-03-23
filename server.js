import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import dotenv from "dotenv";

// ── Load environment variables ──────────────────────────────
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
  EMAIL_PORT: process.env.EMAIL_PORT,
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

// ── Import routes and middleware ────────────────────────────
import mountRoutes from "./src/routes/index.js";
import globalErrorMiddleware from "./src/middlewares/globalErrorMiddleware.js";
import AppError from "./src/utils/AppError.js";

const app = express();

// ── Trust first proxy (Vercel) for correct client IP ────────
app.set("trust proxy", 1);

// ── MongoDB Connection ──────────────────────────────────────
let mongoConnected = false;

const connectDB = async () => {
  if (mongoConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    mongoConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    mongoConnected = false;
    throw error;
  }
};

// ── Security headers ────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────
app.use(cors());

// ── Global rate limiter ─────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests, please try again later.",
  },
});
app.use(globalLimiter);

// ── Body parsers ────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Request logging ─────────────────────────────────────────
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Static files (uploads) ──────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ── Health check ────────────────────────────────────────────
app.get("/api/v1/health-check", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongoConnected: mongoConnected,
  });
});

// ── Root health check ───────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "2BHealthy API is running 🏋️‍♂️",
    version: "1.0.0",
  });
});

// ── Mount all API routes ────────────────────────────────────
mountRoutes(app);

// ── 404 handler ─────────────────────────────────────────────
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// ── Global error middleware ─────────────────────────────────
app.use(globalErrorMiddleware);

// ── Handle uncaught exceptions ──────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION — Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// ── Start Server ────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(
        `🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`,
      );
      console.log(`📡 API Base: http://localhost:${env.PORT}/api/v1`);
    });

    // ── Handle unhandled promise rejections ─────────────────
    process.on("unhandledRejection", (err) => {
      console.error("💥 UNHANDLED REJECTION — Shutting down...");
      console.error(err.name, err.message);
      server.close(() => process.exit(1));
    });

    // ── Graceful shutdown on SIGTERM ────────────────────────
    process.on("SIGTERM", () => {
      console.log("👋 SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("💤 Process terminated.");
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
