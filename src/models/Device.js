import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceUUID: {
      type: String,
      required: [true, "Device UUID is required"],
      unique: true,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    firmware: {
      type: String,
      trim: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ─────────────────────────────────────────────────
// deviceSchema.index({ deviceUUID: 1 });
deviceSchema.index({ user: 1, isConnected: 1 });

const Device = mongoose.model("Device", deviceSchema);

export default Device;
