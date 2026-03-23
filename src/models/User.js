import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  GENDERS,
  LANGUAGES,
  BCRYPT_SALT_ROUNDS,
  ACTIVITY_LEVELS,
  GOAL_TYPES,
} from "../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    // todo 5/3/2026 create and upldate avatar
    avatar: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: GENDERS,
    },
    dateOfBirth: {
      type: Date,
    },
    language: {
      type: String,
      enum: LANGUAGES,
      default: "en",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // ── User profile fields ───────────────────────────────
    heightCm: {
      type: Number,
      min: [50, "Height must be at least 50 cm"],
      max: [300, "Height cannot exceed 300 cm"],
    },
    weightKg: {
      type: Number,
      min: [20, "Weight must be at least 20 kg"],
      max: [500, "Weight cannot exceed 500 kg"],
    },
    bodyFat: {
      type: Number,
      min: [1, "Body fat must be at least 1%"],
      max: [70, "Body fat cannot exceed 70%"],
    },
    activityLevel: {
      type: String,
      enum: ACTIVITY_LEVELS,
      default: "medium",
    },
    goalType: {
      type: String,
      enum: GOAL_TYPES,
    },
    targetWeight: {
      type: Number,
      min: [20, "Target weight must be at least 20 kg"],
      max: [500, "Target weight cannot exceed 500 kg"],
    },

    // ── OTP for email verification ────────────────────────
    otpHash: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },

    // ── OTP for password reset ────────────────────────────
    passwordResetOtpHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },

    // ── FCM token for push notifications ──────────────────
    fcmToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────
// userSchema.index({ email: 1 });

// ── Hash password before save ───────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
  next();
});

// ── Compare password method ─────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
