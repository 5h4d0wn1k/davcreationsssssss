import User from "../models/userModel.js";

export const checkCredentials = async (req, res, next) => {
  const { email, user_password } = req.body;
  console.log(req.body);
  try {
    if(!email || !user_password){
        return res.status(406).json({
        error: "Missing required fields: email, user_password",
      });
    }
    const user = await User.findOne({ email });

    if (!user)
      return res.status(409).json({
        error: "Invalid credentials!",
      });

    if (!user.is_active)
      return res.status(403).json({
        error:
          "Your account has been deactivated. Contact your application Admin to recover your account!",
      });

    const checkPassword = await User.comparePassword(user.user_password, user_password);

    if (!checkPassword)
      return res.status(409).json({
        error: "Invalid credentials!",
      });
      req.userCredentials = {"email": email,"user_password": user_password }
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};