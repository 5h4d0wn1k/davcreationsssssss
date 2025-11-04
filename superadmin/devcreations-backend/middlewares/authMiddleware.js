import Session from "../models/sessionModel.js";
import User from "../models/userModel.js";
import UserType from "../models/userTypeModel.js"

export const CheckAuth = async (req, res, next) => {
  const { sid } = req.signedCookies;

  if (!sid) {
    res.clearCookie("sid");
    return res.status(401).json({ error: "Not logged in!!" });
  }

  try {
    const session = await Session.findById(Number(sid));


    if (!session?.user_id)
      return res.status(401).json({ error: "Not logged in!" });

    const currentTimeInSecond = Math.round(Date.now() / 1000);

    if (currentTimeInSecond > session?.expiry) {
      res.clearCookie("sid");
      return res.status(200).json({
        message: "Loged out!",
      });
    }

    const user = await User.findById(session?.user_id);
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
    const userType = await  UserType.findById(user.user_type_id);
    
    if (userType.name !== "user") return next();
    res.status(403).json({
      error: "You do not have an access to manage users!",
    });
  };
  
  export const isOwner = async (req, res, next) => {
    try {
      const user = req.user;
      const userType = await UserType.findById(user.user_type_id);
      if (!userType || userType.user_type_name !== "superadmin") {
        return res.status(403).json({
          error: "You do not have access to perform owner operations!",
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };

export const isAdmin = async (req, res, next) => {
  const user = req.user;
  const userType = await UserType.findById(user.user_type_id);
  if (userType.user_type_name !== "superadmin" && userType.user_type_name !== "admin")
    return res.status(403).json({
      error: "You do not have access to manage users!",
    });

  next();
};

export const isOwnerOrAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    const userType = await UserType.findById(user.user_type_id);
    if (!userType || (userType.user_type_name !== "superadmin" && userType.user_type_name !== "admin")) {
      return res.status(403).json({
        error: "Unauthorized access!",
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const isManager = async (req, res, next) => {
  const user = req.user;
const userType = await  UserType.findById(user.user_type_id);
if ( userType.user_type_name !== "manager")
    return res.status(403).json({
      error: "You do not have an access to manage users!",
    });
  next();
};
