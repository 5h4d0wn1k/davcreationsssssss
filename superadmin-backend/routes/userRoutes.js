import express from "express";
import { CheckAuth } from "../middlewares/authMiddleware.js";
import {
  createNewPassword,
  createUser,
  getUserDetails,
  loginUser,
  loginWithGoogle,
  logouAll,
  logoutUser,
  sendOtp,
  verifyOtp,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/user/register", createUser);

router.post("/user/login", loginUser);

router.get("/user/data", CheckAuth, getUserDetails);

router.post("/user/logout", logoutUser);

router.post("/user/forgot/password", createNewPassword);

router.post("/user/logout/all", logouAll);

router.post("/user/send-otp", sendOtp);

router.post("/user/verify-otp", verifyOtp);

router.post("/user/google/login", loginWithGoogle);

export default router;
