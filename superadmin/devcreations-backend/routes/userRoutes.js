import express from "express";
import { CheckAuth } from "../middlewares/authMiddleware.js";
import { authLimiter } from "../middlewares/rateLimitMiddleware.js";
import {
  validateRequest,
  loginUserSchema,
  createNewPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../middlewares/validationMiddleware.js";
import {
  createNewPassword,
  getUserDetails,
  loginUser,
  logoutAll,
  logoutUser,
  sendOtp,
} from "../controllers/userController.js";
import { checkCredentials } from "../middlewares/checkCredentials.js";

const router = express.Router();

router.post("/user/login", authLimiter, validateRequest(loginUserSchema), loginUser);

router.get("/user/data", CheckAuth, getUserDetails);

router.post("/user/logout", logoutUser);

router.post("/user/forgot/password", validateRequest(createNewPasswordSchema), createNewPassword);

router.post("/user/logout/all", logoutAll);

router.post("/user/send-otp", authLimiter, checkCredentials, validateRequest(sendOtpSchema), sendOtp);

export default router;
