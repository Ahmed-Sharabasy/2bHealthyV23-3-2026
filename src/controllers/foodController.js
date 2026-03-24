const BASE_URL = "https://api.spoonacular.com";
const API_KEY = process.env.SPOONACULAR_API_KEY;

export const fetchFood = async (req, res) => {
  const { query } = req.query;
  const response = await fetch(
    `${BASE_URL}/recipes/complexSearch?apiKey=${API_KEY}&query=${query}`,
  );
  const data = await response.json();

  // const flutterResponse = {
  //   results: data.results.map((recipe) => ({
  //     id: recipe.id,
  //     title: recipe.title,
  //     image: recipe.image,
  //   })),
  // };
  res.json(data);
};

export const getFullRecipe = async (req, res) => {
  const { recipeId } = req.params;
  const response = await fetch(
    `${BASE_URL}/recipes/${recipeId}/information?apiKey=${API_KEY}&includeNutrition=true`,
  );
  const data = await response.json();
  res.json(data);

  // ... rest of the code
};

export const getFoodNutrition = async (req, res) => {
  const { foodName } = req.params;
  const response = await fetch(
    `${BASE_URL}/recipes/guessNutrition?apiKey=${API_KEY}&title=${foodName}`,
  );
  const data = await response.json();
  // ... rest of the code
};

export const searchRecipesByIngredients = async (req, res) => {
  const { ingredients, number } = req.query;
  const response = await fetch(
    `${BASE_URL}/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${ingredients.join(",")}&number=${number}&ranking=1&ignorePantry=true`,
  );
  const data = await response.json();
  // ... rest of the code
};

// get recipe by name and return its nutrition information
export const getFoodNutritionWithImage = async (req, res) => {
  const { foodName } = req.query; // ✅ query مش params

  const response = await fetch(
    `${BASE_URL}/recipes/complexSearch?apiKey=${API_KEY}&query=${foodName}&addRecipeNutrition=true&number=1`,
  );
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return res.status(404).json({ message: "Food not found" });
  }

  const item = data.results[0];

  res.json({
    title: item.title,
    image: item.image,
    calories: item.nutrition?.nutrients?.find((n) => n.name === "Calories")
      ?.amount,
    protein: item.nutrition?.nutrients?.find((n) => n.name === "Protein")
      ?.amount,
    fat: item.nutrition?.nutrients?.find((n) => n.name === "Fat")?.amount,
    carbs: item.nutrition?.nutrients?.find((n) => n.name === "Carbohydrates")
      ?.amount,
  });
};

// get ingedient and its calories by name
export const searchIngredient = async (req, res) => {
  const { query } = req.query;

  // Step 1: get the id
  const searchResponse = await fetch(
    `${BASE_URL}/food/ingredients/search?apiKey=${API_KEY}&query=${query}&number=1`,
  );
  const searchData = await searchResponse.json();

  if (!searchData.results || searchData.results.length === 0) {
    return res.status(404).json({ message: "Ingredient not found" });
  }

  const ingredient = searchData.results[0];

  // Step 2: get full info with nutrition
  const infoResponse = await fetch(
    `${BASE_URL}/food/ingredients/${ingredient.id}/information?apiKey=${API_KEY}&amount=100&unit=grams&addNutrition=true`,
  );
  const data = await infoResponse.json();

  res.json({
    id: data.id,
    name: data.name,
    image: `https://spoonacular.com/cdn/ingredients_500x500/${data.image}`,
    calories: data.nutrition.nutrients.find((n) => n.name === "Calories")
      ?.amount,
    protein: data.nutrition.nutrients.find((n) => n.name === "Protein")?.amount,
    carbs: data.nutrition.nutrients.find((n) => n.name === "Carbohydrates")
      ?.amount,
    fat: data.nutrition.nutrients.find((n) => n.name === "Fat")?.amount,
  });
};

export const generateRandomMealPlan = async (req, res) => {
//   try {
//     const { days = 10 } = req.query; // default 10 أيام

//     const mealPlan = [];

//     for (let i = 0; i < days; i++) {
//       const [breakfastRes, lunchRes, dinnerRes] = await Promise.all([
//         fetch(
//           `${BASE_URL}/recipes/random?apiKey=${API_KEY}&number=1&tags=breakfast`
//         ),
//         fetch(
//           `${BASE_URL}/recipes/random?apiKey=${API_KEY}&number=1&tags=lunch`
//         ),
//         fetch(
//           `${BASE_URL}/recipes/random?apiKey=${API_KEY}&number=1&tags=dinner`
//         ),
//       ]);

//       const breakfastData = await breakfastRes.json();
//       const lunchData = await lunchRes.json();
//       const dinnerData = await dinnerRes.json();

//       const breakfast = breakfastData.recipes[0];
//       const lunch = lunchData.recipes[0];
//       const dinner = dinnerData.recipes[0];

//       mealPlan.push({
//         day: i + 1,
//         breakfast: {
//           id: breakfast.id,
//           title: breakfast.title,
//           image: breakfast.image,
//         },
//         lunch: {
//           id: lunch.id,
//           title: lunch.title,
//           image: lunch.image,
//         },
//         dinner: {
//           id: dinner.id,
//           title: dinner.title,
//           image: dinner.image,
//         },
//       });
//     }

//     res.json({
//       totalDays: days,
//       plan: mealPlan,
//     });
//   } catch (error) {
//     res.status(500).json({
  try {
    const { days = 10 } = req.query; // default 10 أيام

    const mealPlan = [];

    for (let i = 0; i < days; i++) {
      const [breakfastRes, lunchRes, dinnerRes] = await Promise.all([
        fetch(
          `${BASE_URL}/recipes/random?apiKey=${API_KEY}&number=1&tags=breakfast`,
        ),
        fetch(
          `${BASE_URL}/recipes/random?apiKey=${API_KEY}&number=1&tags=lunch`,
        ),
        fetch(
          `${BASE_URL}/recipes/random?apiKey=${API_KEY}&number=1&tags=dinner`,
        ),
      ]);

      const breakfastData = await breakfastRes.json();
      const lunchData = await lunchRes.json();
      const dinnerData = await dinnerRes.json();

      const breakfast = breakfastData.recipes[0];
      const lunch = lunchData.recipes[0];
      const dinner = dinnerData.recipes[0];

      mealPlan.push({
        day: i + 1,
        breakfast: {
          id: breakfast.id,
          title: breakfast.title,
          image: breakfast.image,
        },
        lunch: {
          id: lunch.id,
          title: lunch.title,
          image: lunch.image,
        },
        dinner: {
          id: dinner.id,
          title: dinner.title,
          image: dinner.image,
        },
      });
    }

    res.json({
      totalDays: days,
      plan: mealPlan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error generating meal plan",
      error: error.message,
    });
  }
};
