import User from "../models/userModel.js";
import UserType from "../models/userTypeModel.js"
import Session from "../models/sessionModel.js";
import { sendOtpService } from "../services/sendOtpService.js";
import OTP from "../models/otpModel.js";

export const loginUser = async (req, res, next) => {
  const { email, user_password, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email, otp });
    console.log(otpRecord)
    if (!otpRecord)
      return res.status(401).json({
        error: "Invalid or Expired OTP!",
      });

    await OTP.deleteByEmail(email);

    const user = await User.findOne({ email });


    if (!user.is_active)
      return res.status(403).json({
        error:
          "Your account has been deactivated. Contact your application Admin to recover your account!",
      });

    if (!user)
      return res.status(409).json({
        error: "Invalid credentials!",
      });
    const checkPassword = await User.comparePassword(user.user_password, user_password);

    if (!checkPassword)
      return res.status(409).json({
        error: "Invalid credentials!",
      });

    const allSession = await Session.find({ user_id: user.user_id });

    if (allSession.length >= 2) {
      await Session.deleteById(allSession[0].id);
    }

    const session = await Session.create({
      user_id: user.user_id,
      expiry: Math.round(Date.now() / 1000) + 60 * 60,
    });
//remove sameSite and secure if domain is same
    res.cookie("sid", session.id, {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: true,
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

    if (!user.is_active)
      return res.status(403).json({
        error:
          "Your account has been deleted. Contact your application Admin to recover your account!",
      });

    const isSamePassword = await User.comparePassword(user.user_password, newPassword);
    if (isSamePassword)
      return res.status(400).json({
        error: "New Password is same as current password!",
      });

    await User.updateById(user.user_id, {
      user_password: newPassword,
    });

    return res.status(201).json({
      message: "Password reset successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDetails = async (req, res) => {
  const userType = await UserType.findById(req.user.user_type_id);
  return res.status(200).json({
    first_name: req.user.first_name,
    last_name: req.user.last_name,
    email: req.user.email,
    picture: req.user.picture,
    userType: userType.user_type_name,
  });
};

export const logoutUser = async (req, res) => {
  const sessionId = Number(req.signedCookies.sid);
  try {
    await Session.deleteById(sessionId);
  } catch (error) {
    console.log(error);
  }

  res.clearCookie("sid");
  res.status(200).end();
};

export const logoutAll = async (req, res) => {
  const sessionId = Number(req.signedCookies.sid);
  try {
    const session = await Session.findById(sessionId);
    if (session) {
      await Session.deleteById(sessionId);
      // Delete all sessions for this user
      await Session.find({ user_id: session.user_id }).then(sessions => {
        sessions.forEach(sess => Session.deleteById(sess.id));
      });
    }
  } catch (error) {
    console.log(error);
  }
 await 
  // res.clearCookie("sid");
  res.status(200).end();
};

export const sendOtp = async (req, res, next) => {
  console.log(req.body)
  const { email } = req.body;
  await sendOtpService(email);
  res.status(201).json({
    message: "OTP sent successfully",
  });
};