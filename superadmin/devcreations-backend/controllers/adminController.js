import Session from "../models/sessionModel.js";
import User from "../models/userModel.js";
import Module from "../models/moduleModel.js";
import UserAccess from "../models/userAccessModel.js";
import UserType from "../models/userTypeModel.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    const sessions = await Session.find();
    const allSessions = sessions.map(({ user_id }) => user_id);

    const usersData = await Promise.all(users.map(async ({ user_id, first_name, last_name, email, is_active, user_type_id }) => {
      const userType = await UserType.findById(user_type_id);
      return {
        user_id,
        first_name,
        last_name,
        email,
        is_active,
        userType: userType.user_type_name,
        isLoggedIn: allSessions.includes(user_id),
      };
    }));

    return res.status(200).json(usersData);
  } catch (error) {
    next(error);
  }
};

export const logoutUserByAdmin = async (req, res, next) => {
  const id  = Number(req.params.id);
  try {
    const user = await User.findById(Number(id));
    const reqUserType = await UserType.findById(req.user.user_type_id);
    const targetUserType = await UserType.findById(user.user_type_id);

    // Define hierarchy: superadmin > admin > manager > user
    const hierarchy = { superadmin: 4, admin: 3, manager: 2, user: 1 };
    if (hierarchy[reqUserType.user_type_name] <= hierarchy[targetUserType.user_type_name])
      return res.status(403).json({
        error: "You can only logout users lower than you in hierarchy!",
      });

    if (req.user.user_id === id)
      return res.status(403).json({ error: "You can not logout yourself!" });

    await Session.find({ user_id: id }).then(sessions => {
      sessions.forEach(session => Session.deleteById(session.id));
    });

    return res.status(200).end();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

export const deleteUserByAdmin = async (req, res, next) => {
  const id = Number(req.params.id);

  if (req.user.user_id === id)
    return res.status(403).json({ error: "You can not delete yourself!" });

  try {
    const user = await User.findById(id);
    const reqUserType = await UserType.findById(req.user.user_type_id);
    const targetUserType = await UserType.findById(user.user_type_id);

    console.log("req: ",reqUserType, "target: ",targetUserType);

    // Define hierarchy: superadmin > admin > manager > user
    const hierarchy = { superadmin: 4, admin: 3, manager: 2, user: 1 };
    if (hierarchy[targetUserType.user_type_name] >= hierarchy[reqUserType.user_type_name])
      return res.status(403).json({
        error: "You can not delete your superior or yourself!",
      });

    await User.updateById(id, { is_active: false });
    await Session.find({ user_id: id }).then(sessions => {
      sessions.forEach(session => Session.deleteById(session.id));
    });

    return res.status(200).json({
      message: "User deleted successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteUserByAdmin = async (req, res, next) => {
  const id = Number(req.params.id);
  console.log(id);

  if (req.user.user_id === id)
    return res.status(403).json({ error: "You can not delete yourself!" });

  try {
    const user = await User.findById(id);
    console.log(user);
    const reqUserType = await UserType.findById(req.user.user_type_id); //from where I want to delete
    const targetUserType = await UserType.findById(user.user_type_id); //to whom I want to delete

    // Define hierarchy: superadmin > admin > manager > user
    const hierarchy = { superadmin: 4, admin: 3, manager: 2, user: 1 };
    if (hierarchy[targetUserType.user_type_name] >= hierarchy[reqUserType.user_type_name])
      return res.status(403).json({
        error: "You can not delete your superior or yourself!",
      });

    await User.deleteById(id);
    await Session.find({ user_id: id }).then(sessions => {
      sessions.forEach(session => Session.deleteById(session.id));
    });

    return res.status(200).json({
      message: "User deleted successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const recoverUser = async (req, res, next) => {
  const id  = Number(req.params.id);
  try {
    await User.updateById(id, { is_active: true });
    res.status(201).end();
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (req, res, next) => {
  const  id = Number(req.params.id);
  const { user_type_name } = req.body;

  try {
    const user = await User.findById(id);
    const reqUserType = await UserType.findById(req.user.user_type_id);
    const targetUserType = await UserType.findById(user.user_type_id);

    // Define hierarchy: superadmin > admin > manager > user
    const hierarchy = { superadmin: 4, admin: 3, manager: 2, user: 1 };
    if (hierarchy[targetUserType.user_type_name] >= hierarchy[reqUserType.user_type_name]) {
      return res.status(403).json({
        error: "Unauthorized change is tried to perform!",
      });
    }

    if (user_type_name === "superadmin")
      return res.status(401).json({
        error: "You can not set superadmin user type!",
      });

    const newUserType = await UserType.findOne({ user_type_name: user_type_name });
    if (!newUserType) {
      return res.status(400).json({ error: "Invalid user type!" });
    }

    await User.updateById(id, { user_type_id: newUserType.user_type_id });

    return res.status(201).end();
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, email, user_password, address, user_type_id } = req.body;

    if (!first_name || !last_name || !email || !user_password || !user_type_id) {
      return res.status(400).json({ error: "Missing required fields: firstName, lastName, email, password, userTypeId" });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const userData = {
    first_name, 
    last_name, 
    phone,
    email, 
    user_password, 
    address, 
    user_type_id,
    created_by: req.user.user_id,
    };

    const newUser = await User.create(userData);

    return res.status(201).json({
      message: "User created successfully",
      user: {
        user_id: newUser.user_id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        phone: newUser.phone,
        email: newUser.email,
        address: newUser.address,
        user_type_id: newUser.user_type_id,
        is_active: newUser.is_active
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: false });
    const usersData = users.map(user => ({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      user_type_id: user.user_type_id,
      is_active: user.is_active
    }));
    return res.status(200).json(usersData);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(Number(id));
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({
     user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      user_type_id: user.user_type_id,
      is_active: user.is_active
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { first_name, last_name, phone, email, user_password, address, user_type_id, is_active } = req.body;
  try {
    const user = await User.findById(Number(id));
    if (!user || !user.is_active) {
      return res.status(404).json({ error: "User not found" });
    }
    const reqUserType = await UserType.findById(req.user.user_type_id);
    const targetUserType = await UserType.findById(user.user_type_id);
    // Define hierarchy: superadmin > admin > manager > user
    const hierarchy = { superadmin: 4, admin: 3, manager: 2, user: 1 };
    if (hierarchy[reqUserType.name] <= hierarchy[targetUserType.name]) {
      return res.status(403).json({ error: "Unauthorized to update this user" });
    }
    if (email && email !== user.email) {
      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }
    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (user_password !== undefined) updateData.user_password = user_password;
    if (address !== undefined) updateData.address = address;
    if (user_type_id !== undefined) updateData.user_type_id = user_type_id;
    if (is_active !== undefined) updateData.is_active = is_active;
    const updatedUser = await User.updateById(Number(id), updateData);
    return res.status(200).json({
      message: "User updated successfully",
      user: {
        user_id: updatedUser.user_id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        address: updatedUser.address,
        user_type_id: updatedUser.user_type_id,
        is_active: updatedUser.is_active
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createModule = async (req, res, next) => {
  try {
    const { module_name, parent_id, url_slug, tool_tip, short_description, is_active } = req.body;
    if (!module_name) {
      return res.status(400).json({ error: "Missing required fields: module_name, url_slug" });
    }

    const existingModule = await Module.findByUrlSlug(url_slug);
    if (existingModule) {
      return res.status(400).json({ error: "urlSlug already exists" });
    }

    if (parent_id) {
      const parentModule = await Module.findById(parent_id);
      if (!parentModule) {
        return res.status(400).json({ error: "Invalid parentId" });
      }
    }

    const moduleData = {
      module_name,
      parent_id,
      url_slug,
      tool_tip,
      short_description,
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user.user_id
    };

    const newModule = await Module.create(moduleData);

    return res.status(201).json({
      message: "Module created successfully",
      module: {
        module_id: newModule.module_id,
        module_name: newModule.module_name,
        parent_id: newModule.parent_id,
        url_slug: newModule.url_slug,
        tool_tip: newModule.tool_tip,
        short_description: newModule.short_description,
        is_active: newModule.is_active
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllModules = async (req, res, next) => {
  try {
    const modules = await Module.find();
    const modulesData = modules.map(module => ({
      module_id: module.module_id,
      module_name: module.module_name,
      parent_id: module.parent_id,
      url_slug: module.url_slug,
      tool_tip: module.tool_tip,
      short_description: module.short_description,
      is_active: module.is_active
    }));
    return res.status(200).json(modulesData);
  } catch (error) {
    next(error);
  }
};

export const getModuleById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const module = await Module.findById(Number(id));
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }
    return res.status(200).json({
      module_id: module.module_id,
      module_name: module.module_name,
      parent_id: module.parent_id,
      url_slug: module.url_slug,
      tool_tip: module.tool_tip,
      short_description: module.short_description,
      is_active: module.is_active
    });
  } catch (error) {
    next(error);
  }
};

export const updateModule = async (req, res, next) => {
  const { id } = req.params;
  const { module_name, parent_id, url_slug, tool_tip, short_description, is_active } = req.body;
  try {
    const module = await Module.findById(Number(id));
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    if (url_slug && url_slug !== module.url_slug) {
      const existing = await Module.findByUrlSlug(url_slug);
      if (existing) {
        return res.status(400).json({ error: "urlSlug already exists" });
      }
    }

    if (parent_id && parent_id !== module.parent_id) {
      const parentModule = await Module.findById(Number(parent_id));
      if (!parentModule) {
        return res.status(400).json({ error: "Invalid parentId" });
      }
    }

    const updateData = {};
    if (module_name !== undefined) updateData.module_name = module_name;
    if (parent_id !== undefined) updateData.parent_id = parent_id;
    if (url_slug !== undefined) updateData.url_slug = url_slug;
    if (tool_tip !== undefined) updateData.tool_tip = tool_tip;
    if (short_description !== undefined) updateData.short_description = short_description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedModule = await Module.updateById(Number(id), updateData);

    return res.status(200).json({
      message: "Module updated successfully",
      module: {
        module_id: updatedModule.module_id,
        module_name: updatedModule.module_name,
        parent_id: updatedModule.parent_id,
        url_slug: updatedModule.url_slug,
        tool_tip: updatedModule.tool_tip,
        short_description: updatedModule.short_description,
        is_active: updatedModule.is_active
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateModule = async (req, res, next) => {
  const { id } = req.params;
  try {
    const module = await Module.findById(Number(id));
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    await Module.updateById(Number(id), { is_active: false });

    return res.status(200).json({
      message: "Module deactivated successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getUserModules = async (req, res, next) => {
  const { userId } = req.params;
  const user_id = Number(userId);
  try {
    const user = await User.findById(user_id);
    if (!user || !user.is_active) {
      return res.status(404).json({ error: "User not found" });
    }

    const userAccesses = await UserAccess.find({ user_id, is_active: true });
    const moduleIds = userAccesses.map(access => access.module_id);

    const modules = await Module.find({ module_id: { in: moduleIds } });
    const modulesData = modules.map(module => ({
      module_id: module.module_id,
      module_name: module.module_name,
      parent_id: module.parent_id,
      url_slug: module.url_slug,
      tool_tip: module.tool_tip,
      short_description: module.short_description,
      is_active: module.is_active
    }));

    return res.status(200).json(modulesData);
  } catch (error) {
    next(error);
  }
};

export const assignModuleToUser = async (req, res, next) => {
  const { user_id, module_id } = req.body;

  if (!user_id || !module_id) {
    return res.status(400).json({ error: "Missing required fields: userId, module_id" });
  }

  try {
    const user = await User.findById(user_id);
    if (!user || !user.is_active) {
      return res.status(404).json({ error: "User not found" });
    }

    const module = await Module.findById(module_id);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    const existingAccess = await UserAccess.findOne({ user_id, module_id, is_active: true });
    if (existingAccess) {
      return res.status(400).json({ error: "Module already assigned to user" });
    }

    const accessData = {
      user_id,
      module_id,
      created_by: req.user.user_id,
      is_active: true
    };

    const newAccess = await UserAccess.create(accessData);

    return res.status(201).json({
      message: "Module assigned to user successfully",
      access: {
        user_access_id: newAccess.user_access_id,
        user_id: newAccess.user_id,
        module_id: newAccess.module_id,
        created_by: newAccess.created_by,
        is_active: newAccess.is_active
      }
    });
  } catch (error) {
    next(error);
  }
};

export const unassignModuleFromUser = async (req, res, next) => {
  const { user_id, module_id } = req.body;

  if (!user_id || !module_id) {
    return res.status(400).json({ error: "Missing required fields: user_id, module_id" });
  }

  try {
    const user = await User.findById(user_id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }

    const module = await Module.findById(module_id);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    const existingAccess = await UserAccess.findOne({ user_id, module_id, is_active: true });
    if (!existingAccess) {
      return res.status(400).json({ error: "Module not assigned to user" });
    }
   

    // await UserAccess.updateById(existingAccess.user_id, { is_active: false });
    await UserAccess.updateById(existingAccess.user_access_id, { is_active: false });
    
    return res.status(200).json({
      message: "Module unassigned from user successfully"
    });
  } catch (error) {
    console.log("error from 563",error);
    next(error);
  }
};


export const createUserType = async (req, res, next) => {
  try {
    const { user_type_name, user_type_value} = req.body;

    if (!user_type_name || ! user_type_value) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUserType = await UserType.findOne({ user_type_name });
    if (existingUserType) {
      return res.status(400).json({ error: "UserType with this user_type_name already exists" });
    }
    const userTypeData = {
      user_type_name,
      user_type_value,
      created_by: req.user.user_id
    }

    const newUserType = await UserType.create(userTypeData);

    return res.status(201).json({
      message: "UserType created successfully",
      userType: {
        id: newUserType.id,
        user_type_name: newUserType.user_type_name,
        user_type_value: newUserType.user_type_value
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUserTypes = async (req, res, next) => {
  try {
    const userTypes = await UserType.find();
    const userTypesData = userTypes.map(userType => ({
      user_type_id: userType.user_type_id,
      user_type_name: userType.user_type_name,
      user_type_value: userType.user_type_value,
      is_active: userType.is_active

    }));
    return res.status(200).json(userTypesData);
  } catch (error) {
    next(error);
  }
};

export const getUserTypeById = async (req, res, next) => {
  const { user_type_id } = req.params;
  try {
    const userType = await UserType.findById(Number(user_type_id));
    if (!userType) {
      return res.status(404).json({ error: "UserType not found" });
    } 
    return res.status(200).json({
     user_type_id: userType.user_type_id,
      user_type_name: userType.user_type_name,
      user_type_value: userType.user_type_value,
      is_active: userType.is_active

    });
  } catch (error) {
    next(error);
  }
};

export const updateUserType = async (req, res, next) => {
  const { user_type_id } = req.params;
  const { user_type_name, user_type_value } = req.body;
  try {
    const userType = await UserType.findById(Number(user_type_id));
    if (!userType) {
      return res.status(404).json({ error: "UserType not found" });
    }

    if (user_type_name && user_type_name !== userType.user_type_name) {
      const existing = await UserType.findOne({ user_type_name });
      if (existing) {
        return res.status(400).json({ error: "UserType with this user_type_name already exists" });
      }
    }

    const updateData = {
      user_type_name: user_type_name,
      user_type_value: user_type_value
    };

    const updatedUserType = await UserType.updateById(Number(user_type_id), updateData);

    return res.status(200).json({
      message: "UserType updated successfully",
      userType: {
        user_type_id: updatedUserType.user_type_id,
        user_type_name: updatedUserType.user_type_name,
        user_type_value: updatedUserType.user_type_value

      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserType = async (req, res, next) => {
  const { user_type_id } = req.params;
  try {
    const userType = await UserType.findById(Number(user_type_id));
    if (!userType) {
      return res.status(404).json({ error: "UserType not found" });
    }

    // Check if any users are assigned to this user type
    const users = await User.find({ user_type_id: Number(user_type_id) });
    if (users.length > 0) {
      return res.status(400).json({ error: "Cannot delete UserType as users are assigned to it" });
    }

    await UserType.deleteById(Number(user_type_id));

    return res.status(200).json({
      message: "UserType deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
