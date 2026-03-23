// //? Working with excercises API

// const exercisesOptions = {
//   method: "GET",
//   // url: 'https://exercisedb.p.rapidapi.com/image',
//   headers: {
//     "x-rapidapi-host": process.env.EXERCISES_RAPID_API_HOST,
//     "x-rapidapi-key": process.env.EXERCISES_RAPID_API_KEY,
//   },
// };

// const fetchExercises = async (url, options) => {
//   const response = await fetch(url, options);
//   const data = await response.json();
//   return data;
// };

// export { fetchExercises, exercisesOptions };

// const fetch = require("node-fetch");

const exercisesOptions = {
  method: "GET",
  headers: {
    "x-rapidapi-key": "adfe621f5emsh5286b23b30f5889p134f4ejsn9fc8b6d8abe1",
    "x-rapidapi-host": "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com",
  },
};

const fetchExercises = async (url, options) => {
  const response = await fetch(url, options);
  const data = await response.json();
  return data;
};

export { fetchExercises, exercisesOptions };
