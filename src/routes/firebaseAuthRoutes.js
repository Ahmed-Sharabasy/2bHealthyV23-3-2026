import express from "express";
import * as firebaseAuthController from "../controllers/firebaseAuthController.js";
import protectFirebaseRoute from "../middlewares/firebaseAuthMiddleware.js";

const router = express.Router();

// router
//   .route("/getUserByFcmToken")
//   .get(protectFirebaseRoute, firebaseAuthController.getUserByFcmToken);

// router
//   .route("/createToken")
//   .post(protectFirebaseRoute, firebaseAuthController.createFirebaseToken);

//? You must add admin middleware to get all firebase users
// router
//   .route("/getAllFirebaseUsers")
//   .get(firebaseAuthController.getAllFirebaseUsers);

export default router;
