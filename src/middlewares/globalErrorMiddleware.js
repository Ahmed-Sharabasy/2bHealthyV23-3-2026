import env from "../config/env.js";

const globalErrorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // ── Production ──────────────────────────────────────────
  // Operational / trusted error — send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // ── Mongoose CastError (bad ObjectId) ───────────────────
  if (err.name === "CastError") {
    return res.status(400).json({
      status: "fail",
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // ── Mongoose duplicate key ──────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(", ");
    return res.status(400).json({
      status: "fail",
      message: `Duplicate field value for: ${field}. Please use another value.`,
    });
  }

  // ── Mongoose validation error ───────────────────────────
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      status: "fail",
      message: `Validation error: ${messages.join(". ")}`,
    });
  }

  // ── JWT errors ──────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "fail",
      message: "Invalid token. Please log in again.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "fail",
      message: "Your token has expired. Please log in again.",
    });
  }

  // ── Meal-specific errors ─────────────────────────────────

  // Invalid meal ID format (not a valid idMeal or ObjectId)
  if (
    err.name === "CastError" &&
    err.path === "idMeal"
  ) {
    return res.status(400).json({
      status: "fail",
      message: `Invalid meal ID format: "${err.value}". Please provide a valid meal ID.`,
    });
  }

  // Meal not found (404 from FoodService)
  if (
    err.isOperational &&
    err.statusCode === 404 &&
    err.message.toLowerCase().includes("meal")
  ) {
    return res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }

  // Invalid nutrition filter values (NaN from parseFloat)
  if (
    err.name === "CastError" &&
    (err.path || "").startsWith("nutrition.")
  ) {
    return res.status(400).json({
      status: "fail",
      message: `Invalid nutrition filter value for "${err.path}": "${err.value}". Please provide a valid number.`,
    });
  }

  // Missing search query for meals
  if (
    err.isOperational &&
    err.statusCode === 400 &&
    err.message.toLowerCase().includes("search query")
  ) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }

  // ── Unknown / programming error — don't leak details ───
  console.error("💥 ERROR:", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong. Please try again later.",
  });
};

export default globalErrorMiddleware;
