import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Achievement name is required"],
      unique: true,
      trim: true,
    },
    condition: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Achievement condition is required"],
    },
    icon: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Achievement = mongoose.model("Achievement", achievementSchema);

export default Achievement;
