// import { Router } from "express";
// import sensorController from "../controllers/sensorController.js";
// import {
//   submitReadingValidator,
//   syncDeviceValidator,
// } from "../validators/sensorValidator.js";
// import authMiddleware from "../middlewares/authMiddleware.js";
// import validateRequest from "../middlewares/validateRequest.js";

// const router = Router();

// // ── All routes are protected ────────────────────────────────
// router.use(authMiddleware);

// router.post(
//   "/reading",
//   submitReadingValidator,
//   validateRequest,
//   sensorController.submitReading,
// );
// router.post(
//   "/sync",
//   syncDeviceValidator,
//   validateRequest,
//   sensorController.syncDevice,
// );
// router.get("/readings", sensorController.getReadings);
// router.get("/daily-steps", sensorController.getDailySteps);

// export default router;
