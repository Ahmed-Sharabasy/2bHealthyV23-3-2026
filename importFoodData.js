/**
 * ─────────────────────────────────────────────
 * SEEDER SCRIPT — importData.js
 * ─────────────────────────────────────────────
 * Reads the raw JSON, transforms ingredient/measure
 * pairs into a clean array, and bulk-inserts into MongoDB.
 *
 * Usage:
 *   node importData.js --import    (seed data)
 *   node importData.js --delete    (destroy all data)
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Meal from './src/models/Meal.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env variables
dotenv.config({ path: join(__dirname, 'config.env') });

// ── Connect to DB ───────────────────────────────
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('📦 MongoDB Connected for seeding');
};

// ── Transform raw meal data ─────────────────────
const transformMeal = (raw) => {
  // Build clean ingredients array from strIngredient1..20 + strMeasure1..20
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = raw[`strIngredient${i}`];
    const measure = raw[`strMeasure${i}`];

    // Skip empty, null, undefined, or whitespace-only values
    if (name && name.trim() !== '') {
      ingredients.push({
        name: name.trim(),
        measure: measure ? measure.trim() : '',
      });
    }
  }

  return {
    idMeal: raw.idMeal,
    strMeal: raw.strMeal,
    strMealAlternate: raw.strMealAlternate || null,
    strCategory: raw.strCategory,
    strArea: raw.strArea,
    strInstructions: raw.strInstructions,
    strMealThumb: raw.strMealThumb,
    strTags: raw.strTags || null,
    strYoutube: raw.strYoutube || null,
    strSource: raw.strSource || null,
    strImageSource: raw.strImageSource || null,
    strCreativeCommonsConfirmed: raw.strCreativeCommonsConfirmed || null,
    dateModified: raw.dateModified ? new Date(raw.dateModified) : null,
    ingredients,
    nutrition: raw.nutrition || {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      sugar: 0,
      sodium: 0,
    },
  };
};

// ── Import data ─────────────────────────────────
const importData = async () => {
  try {
    const rawData = JSON.parse(
      fs.readFileSync(
        join(__dirname, 'meals_with_nutrition.json'),
        'utf-8'
      )
    );

    console.log(`📄 Read ${rawData.length} meals from JSON file`);

    // Transform all meals
    const meals = rawData.map(transformMeal);
    console.log('🔄 Data transformation complete');

    // Bulk insert
    await Meal.insertMany(meals, { ordered: false });
    console.log(`✅ Successfully imported ${meals.length} meals into MongoDB`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Import Error:', err.message);
    process.exit(1);
  }
};

// ── Delete all data ─────────────────────────────
const deleteData = async () => {
  try {
    await Meal.deleteMany();
    console.log('🗑️  All meal data deleted successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Delete Error:', err.message);
    process.exit(1);
  }
};

// ── CLI entry point ─────────────────────────────
const run = async () => {
  await connectDB();

  if (process.argv[2] === '--import') {
    await importData();
  } else if (process.argv[2] === '--delete') {
    await deleteData();
  } else {
    console.log('⚠️  Please use --import or --delete flag');
    console.log('   node importData.js --import');
    console.log('   node importData.js --delete');
    process.exit(1);
  }
};

run();
