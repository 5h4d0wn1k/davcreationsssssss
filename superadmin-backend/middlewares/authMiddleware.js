import Session from "../models/sessionModel.js";
import User from "../models/userModel.js";

export const CheckAuth = async (req, res, next) => {
  const { sid } = req.signedCookies;

  if (!sid) {
    res.clearCookie("sid");
    return res.status(401).json({ error: "Not logged in!!" });
  }

  try {
    const session = await Session.findById(sid);

    if (!session?.userId)
      return res.status(401).json({ error: "Not logged in!" });

    const currentTimeInSecond = Math.round(Date.now() / 1000);

    if (currentTimeInSecond > session?.expiry) {
      res.clearCookie("sid");
      return res.status(200).json({
        message: "Loged out!",
      });
    }

    const user = await User.findById(session?.userId);
    if (!user) return res.status(401).json({ error: "Not logged in!" });
    else if (user.isDeleted)
      return res.status(403).json({
        error:
          "Your account has been deleted. Contact your application Admin to recover your account!",
      });
    req.user = user;
  } catch (error) {
    next(error);
  }
  next();
};

export const isAdminOrManager = async (req, res, next) => {
  const user = req.user;
  if (user.role !== 0) return next();
  res.status(403).json({
    error: "You do not have an access to manage users!",
  });
};

export const isOwner = async (req, res, next) => {
  const user = req.user;
  if (user.role !== 3)
    return res.status(403).json({
      error: "You do not have an access to perform owner operation!",
    });
  next();
};

export const isAdmin = async (req, res, next) => {
  const user = req.user;
  if (user.role < 2)
    return res.status(403).json({
      error: "You do not have an access to manage users!!",
    });

  next();
};

export const isOwnerOrAdmin = async (req, res, next) => {
  const user = req.user;
  if (user.role >= 2) return next();
  return res.status(401).json({
    error: "Unauthorized access!",
  });
};

export const isManager = async (req, res, next) => {
  const user = req.user;
  if (user.role !== 1)
    return res.status(403).json({
      error: "You do not have an access to manage users!",
    });
  next();
};
