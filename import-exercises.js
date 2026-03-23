import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'config.env') });

// Database connection
const DB = process.env.MONGO_URI;

mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful!'))
  .catch((err) => {
    console.error('DB connection error:', err);
    process.exit(1);
  });

// Define the Exercise schema within the script completely mirroring the project's model,
// because importing the existing CommonJS model inside an ES module context can cause a crash.
const exerciseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    bodyPart: { type: String, required: true },
    equipment: { type: String, required: true },
    target: { type: String, required: true },
    secondaryMuscles: { type: [String], default: [] },
    instructions: { type: [String], default: [] },
    gifUrl: { type: String, required: true },
    cloudinaryGifUrl: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema);

// Read the JSON file
const filePath = path.join(__dirname, 'fullExerciseApi.exercises.json');
const exercisesData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// Clean up the data by removing _id, createdAt, and updatedAt (and __v for safety)
const cleanedData = exercisesData.map((item) => {
  const { _id, createdAt, updatedAt, __v, ...rest } = item;
  return rest;
});

const importData = async () => {
  try {
    console.log(`Starting import of ${cleanedData.length} exercises...`);
    
    // Perform bulk insertion
    await Exercise.insertMany(cleanedData);
    
    console.log('Exercises successfully loaded into the database!');
  } catch (err) {
    if (err.code === 11000) {
      console.log('Duplicate key error: Some or all exercises already exist in the database.');
    } else {
      console.error('Error importing data:', err);
    }
  }
  process.exit();
};

importData();
