// //? Working with food API

// const exercisesOptions = {
//   method: "GET",
//   headers: {
//     "x-rapidapi-key": "adfe621f5emsh5286b23b30f5889p134f4ejsn9fc8b6d8abe1",
//     "x-rapidapi-host": "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com",
//   },
// };

const URL = "https://api.spoonacular.com";
const API_KEY = process.env.SPOONACULAR_API_KEY;

const fetchFood = async (url) => {
  const response = await fetch(url);
  const data = await response.json();
  return data;
};

export { fetchFood };
