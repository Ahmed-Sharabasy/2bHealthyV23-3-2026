import mongoose from "mongoose";

const timestampSchema = new mongoose.Schema(
  {
    _seconds: Number,
    _nanoseconds: Number,
  },
  { _id: false },
);

const goalsSchema = new mongoose.Schema(
  {
    calories_target: Number,
    water_target: Number,
  },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    workout_time: String,
    wakeup_time: String,
    sleep_time: String,

    notifications_enabled: Boolean,

    plan_enabled: Boolean,
    plan_end_date: Date,
  },
  { _id: false },
);

const progressSchema = new mongoose.Schema(
  {
    water_intake: {
      type: Number,
      default: 0,
    },

    calories: {
      type: Number,
      default: 0,
    },

    steps: {
      type: Number,
      default: 0,
    },

    last_updated: Date,
  },
  { _id: false },
);

const sleepDailySchema = new mongoose.Schema(
  {
    dayName: String,
    year: Number,
    weekday: Number,
    source: String,
    month: Number,
    day: Number,

    dateKey: String,

    hours: Number,
    minutes: Number,
    seconds: Number,

    sleepSeconds: Number,
    sleepHms: String,
    sleepHoursDouble: Number,

    dateStart: timestampSchema,

    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  },
  { _id: false },
);

const firebaseUserSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
    },

    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    avatar: String,
    avatarPath: String,

    gender: {
      type: String,
      enum: ["male", "female"],
    },

    dateOfBirth: Date,

    heightCm: Number,
    weightKg: Number,
    bmi: Number,

    latestSteps: Number,
    latestHeartRate: Number,
    latestSpO2: Number,

    fcmToken: String,

    createdAt: timestampSchema,
    updatedAt: timestampSchema,

    weightUpdatedAt: timestampSchema,
    fcmTokenUpdatedAt: timestampSchema,
    sleep_daily_last_updated: timestampSchema,
    lastHealthUpdate: timestampSchema,

    goals: goalsSchema,

    settings: settingsSchema,

    progress: progressSchema,

    sleep_daily_last_key: String,

    sleep_daily_map: {
      type: Map,
      of: sleepDailySchema,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const FirebaseUser = mongoose.model("FirebaseUser", firebaseUserSchema);

export default FirebaseUser;
