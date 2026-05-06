import AppError from "../utils/AppError.js";

export const createFirebaseToken = async (req, res, next) => {
  const firebaseToken = req.body.firebaseToken;

  if (!firebaseToken) {
    return res.status(400).json({
      status: "fail",
      message: "Firebase Token is required",
    });
  }

  res.status(201).json({
    firebaseToken,
    status: "success",
    message: "Firebase Token created successfully",
  });
};

export const createFirebaseUser = async (req, res, next) => {
  const firebaseUser = req.user;

  res.status(201).json({
    status: "success",
    data: firebaseUser,
  });
};

export const getUserByFcmToken = async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("User not found", 404));
  }

  const firebaseUser = req.user;

  res.status(201).json({
    status: "success",
    data: firebaseUser,
  });
};
