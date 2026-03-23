import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import mealRoutes from "./mealRoutes.js";
import workoutRoutes from "./workoutRoutes.js";
import deviceRoutes from "./deviceRoutes.js";
// import exercisesRoutes from "./exercisesRoutes.js";
import foodRoutes from "./foodRoutes.js";
import exerciseRoutes from "./exerciseRoutes.js";
import aiRoutes from "./aiRoutes.js";
// import sensorRoutes from "./sensorRoutes.js";
// import notificationRoutes from "./notificationRoutes.js";

const API_PREFIX = "/api/v1";

const mountRoutes = (app) => {
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/meals`, mealRoutes);
  app.use(`${API_PREFIX}/workouts`, workoutRoutes);
  app.use(`${API_PREFIX}/devices`, deviceRoutes);
  // app.use(`${API_PREFIX}/api-exercises`, exercisesRoutes);
  app.use(`${API_PREFIX}/api-foods`, foodRoutes);

  // Exercise routes
  app.use(`${API_PREFIX}/exercise`, exerciseRoutes);

  // AI-powered fitness & nutrition routes
  app.use(`${API_PREFIX}/ai`, aiRoutes);

  // app.use(`${API_PREFIX}/sensors`, sensorRoutes);
  // app.use(`${API_PREFIX}/notifications`, notificationRoutes);
};

export default mountRoutes;
