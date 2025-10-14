import User from "../models/userModel.js";
import Session from "../models/sessionModel.js";
import { sendOtpService } from "../services/sendOtpService.js";
import OTP from "../models/otpModel.js";
import { verifyToken } from "../services/googleAuthService.js";
import { randomUUID } from "crypto";

export const createUser = async (req, res, next) => {
  const { name, email, password, otp } = req.body;
  if (!name && !email && !password)
    return res.status(400).json({ message: "All fileds are required!" });

  try {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord)
      return res.status(401).json({
        error: "Invalid or Expired OTP",
      });

    await OTP.deleteByEmail(email);

    const users = await User.find();

    const user = await User.create({
      name,
      email,
      password,
      role: users.length ? 0 : 3,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: "Email already exists!",
      });
    } else {
      next(error);
    }
  }
};

export const loginUser = async (req, res, next) => {
  const { email, password, otp } = req.body;
  console.log(req.body);

  try {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord)
      return res.status(401).json({
        error: "Invalid or Expired OTP!",
      });

    await OTP.deleteByEmail(email);

    const user = await User.findOne({ email });

    if (user.isDeleted)
      return res.status(403).json({
        error:
          "Your account has been deleted. Contact your application Admin to recover your account!",
      });

    if (!user)
      return res.status(409).json({
        error: "Invalid credentials!",
      });
console.log(user.password);
    const checkPassword = await User.comparePassword(user.password, password);
    console.log(checkPassword);

    if (!checkPassword)
      return res.status(409).json({
        error: "Invalid credentials!",
      });

    const allSession = await Session.find({ userId: user.id });

    if (allSession.length >= 2) {
      await Session.deleteById(allSession[0].id);
    }

    const session = await Session.create({
      userId: user.id,
      expiry: Math.round(Date.now() / 1000) + 60 * 60,
    });

    res.cookie("sid", session.id, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });

    res.status(200).json({
      message: "Logged in",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const createNewPassword = async (req, res, next) => {
  const { email, newPassword, otp } = req.body;
  try {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord)
      return res.status(401).json({
        error: "Invalid or Expired OTP!",
      });

    await OTP.deleteByEmail(email);

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({
        error: "User not found!",
      });

    if (user.isDeleted)
      return res.status(403).json({
        error:
          "Your account has been deleted. Contact your application Admin to recover your account!",
      });

    const isSamePassword = await User.comparePassword(user.password, newPassword);
    if (isSamePassword)
      return res.status(400).json({
        error: "New Password is same as current password!",
      });

    await User.updateById(user.id, {
      password: newPassword,
    });

    return res.status(201).json({
      message: "Password reset successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDetails = (req, res) => {
  return res.status(200).json({
    name: req.user.name,
    email: req.user.email,
    picture: req.user.picture,
    role: req.user.role,
  });
};

export const logoutUser = async (req, res) => {
  const sessionId = req.signedCookies.sid;
  try {
    await Session.deleteById(sessionId);
  } catch (error) {
    console.log(error);
  }

  res.clearCookie("sid");
  res.status(200).end();
};

export const logouAll = async (req, res) => {
  const sessionId = req.signedCookies.sid;
  try {
    const session = await Session.findById(sessionId);
    if (session) {
      await Session.deleteById(sessionId);
      // Delete all sessions for this user
      await Session.find({ userId: session.userId }).then(sessions => {
        sessions.forEach(sess => Session.deleteById(sess.id));
      });
    }
  } catch (error) {
    console.log(error);
  }

  res.clearCookie("sid");
  res.status(200).end();
};

export const sendOtp = async (req, res, next) => {
  const { email } = req.body;
  await sendOtpService(email);
  res.status(201).json({
    message: "OTP sent successfully",
  });
};

export const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord)
    return res.status(404).json({
      error: "Invalid or Expired OTP",
    });

  res.status(201).json({
    message: "OTP verification successful",
  });
};

export const loginWithGoogle = async (req, res, next) => {
  const { idToken } = req.body;

  if (!idToken)
    return res.status(400).json({
      error: "something went wrong!",
    });

  try {
    const { email } = await verifyToken(idToken);

    const user = await User.findOne({ email });

    if (user?.isDeleted)
      return res.status(403).json({
        error:
          "Your account has been deleted. Contact your application Admin to recover your account!",
      });

    if (user) {
      const userSessions = await Session.find({ userId: user.id });

      if (userSessions.length >= 2) {
        await Session.deleteById(userSessions[0].id);
      }

      const session = await Session.create({
        userId: user.id,
        expiry: Math.round(Date.now() / 1000) + 60 * 60,
      });

      res.cookie("sid", session.id, {
        httpOnly: true,
        signed: true,
        maxAge: 60 * 1000 * 60 * 24 * 7,
      });

      return res.status(200).json({
        message: "Login successfully!",
      });
    } else {
      const { email, name, picture } = await verifyToken(idToken);

      const users = await User.find();

      const user = await User.create({
        name,
        email,
        password: randomUUID(),
        picture,
        role: users.length ? 0 : 3,
      });

      const setSession = await Session.create({
        userId: user.id,
        expiry: Math.round(Date.now() / 1000) + 60 * 60,
      });

      res.cookie("sid", setSession.id, {
        httpOnly: true,
        signed: true,
        maxAge: 60 * 1000 * 60 * 24 * 7,
      });

      return res.status(201).json({
        success: true,
        message: "User created successfully.",
      });
    }
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: "Email already exists!",
      });
    } else {
      next(error);
    }
  }
};
