import express from "express";
import * as firebaseAuthController from "../controllers/firebaseAuthController.js";
import protectFirebaseRoute from "../middlewares/firebaseAuthMiddleware.js";

const router = express.Router();

router
  .route("/getUserByFcmToken")
  .get(protectFirebaseRoute, firebaseAuthController.getUserByFcmToken);

router
  .route("/createToken")
  .post(protectFirebaseRoute, firebaseAuthController.createFirebaseToken);

export default router;
