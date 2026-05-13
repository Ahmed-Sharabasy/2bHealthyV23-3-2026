import AppError from "../utils/AppError.js";
import FirebaseUser from "../models/FirebaseUser.js";
import admin from "firebase-admin";

export const createFirebaseToken = async (req, res, next) => {
  const firebaseToken = req.user.token;

  if (!firebaseToken) {
    return next(new AppError("Firebase Token is required", 400));
  }

  const firebaseUser = await FirebaseUser.findOne({ uid: req.user.uid });

  if (firebaseUser) {
    return next(new AppError("Firebase User already exists", 400));
  }

  const newFirebaseUser = await FirebaseUser.create({
    token: firebaseToken,
    uid: req.user.uid,
    email: req.user.email,
  });

  res.status(201).json({
    firebaseToken,
    newFirebaseUser,
    status: "success",
    message: "Firebase Token created successfully",
  });
};

// export const getUserByFcmToken = async (req, res, next) => {
//   if (!req.user) {
//     return next(new AppError("User not found", 404));
//   }

//   const firebaseUser = req.user;

//   res.status(201).json({
//     status: "success",
//     data: firebaseUser,
//   });
// };

export const getAllFirebaseUsers = async (req, res, next) => {
  const db = admin.firestore();

  // get all users from firestore
  const snapshot = await db.collection("users").get();

  const users = snapshot.docs.map((doc) => doc.data());

  if (!users) {
    return next(new AppError("Users not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: users,
    // snapshot,
  });
};

//TODO Work on this later 13/5
// export const uploadFirestoreUsersDataIntoMongo = async (req, res, next) => {
//   const db = admin.firestore();

//   // get all users from firestore
//   const snapshot = await db.collection("users").get();

//   const users = snapshot.docs.map((doc) => doc.data());

//   if (!users) {
//     return next(new AppError("Users not found", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: users,
//     // snapshot,
//   });
// };
