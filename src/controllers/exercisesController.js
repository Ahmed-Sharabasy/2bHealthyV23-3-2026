import { fetchExercises, exercisesOptions } from "../utils/exercises.js";

// get all Exercises
export const getExercises = async (req, res) => {
  const exercises = await fetchExercises(
    "https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises",
    exercisesOptions,
  );
  res.json(exercises);
  console.log(exercises);
};

// get exercise by id
export const getExerciseById = async (req, res) => {
  const { id } = req.params;
  const exercise = await fetchExercises(
    `https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/${id}`,
    exercisesOptions,
  );
  res.json(exercise);
  console.log(exercise);
};

// get all exercisetypes
export const getExerciseTypes = async (req, res) => {
  const exerciseTypes = await fetchExercises(
    "https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercisetypes",
    exercisesOptions,
  );
  res.json(exerciseTypes);
  console.log(exerciseTypes);
};

// get exercise by search
export const getExerciseBySearch = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      return res.status(400).json({
        status: "fail",
        message: "Search query is required",
      });
    }

    // تأكد إن المسافات تتحول لـ %20
    const encodedSearch = encodeURIComponent(search);

    const exercises = await fetchExercises(
      `https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/search?search=${encodedSearch}`,
      exercisesOptions,
    );

    res.json(exercises);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// get all muscles
export const getMuscles = async (req, res) => {
  const muscles = await fetchExercises(
    "https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/muscles",
    exercisesOptions,
  );
  res.json(muscles);
  console.log(muscles);
};

// get all bodyparts
export const getBodyParts = async (req, res) => {
  const bodyParts = await fetchExercises(
    "https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/bodyparts",
    exercisesOptions,
  );
  res.json(bodyParts);
  console.log(bodyParts);
};

// get all equipments
export const getEquipments = async (req, res) => {
  const equipments = await fetchExercises(
    "https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/equipments",
    exercisesOptions,
  );
  res.json(equipments);
  console.log(equipments);
};

// export const getExerciseBySearch = async (req, res) => {
//   const { search } = req.query;
//   console.log(search);
//   // /search?search=chest%20press
//   const exercises = await fetchExercises(
//     `https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/search?search=${search}`,
//     exercisesOptions,
//   );
//   res.json(exercises);
//   console.log(exercises);
// };

// const getExercises = async (req, res) => {
//   const exercises = await fetchExercises(
//     "https://exercisedb.p.rapidapi.com/exercises",
//     exercisesOptions,
//   );
//   res.json(exercises);
//   console.log(exercises);
// };

// export { getExercises };
