import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Exercise ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
      index: true,
    },
    bodyPart: {
      type: String,
      required: [true, 'Body part is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    equipment: {
      type: String,
      required: [true, 'Equipment is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    target: {
      type: String,
      required: [true, 'Target muscle is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    secondaryMuscles: {
      type: [String],
      default: [],
    },
    instructions: {
      type: [String],
      default: [],
    },
    gifUrl: {
      type: String,
      required: [true, 'GIF URL is required'],
    },
    cloudinaryGifUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text index for search functionality
exerciseSchema.index({ name: 'text' });

export default mongoose.model('Exercise', exerciseSchema);
