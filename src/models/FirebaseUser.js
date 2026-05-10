import mongoose from "mongoose";

const firebaseUserSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    token: {
      type: String,
    },
  },
  { timestamps: true },
);

const FirebaseUser = mongoose.model("FirebaseUser", firebaseUserSchema);

export default FirebaseUser;
