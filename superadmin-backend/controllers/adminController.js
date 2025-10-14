import Session from "../models/sessionModel.js";
import User from "../models/userModel.js";
import AdminModule from "../models/adminModuleModel.js";
import UserAccess from "../models/userAccessModel.js";
import { rm } from "fs/promises";

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    const sessions = await Session.find();
    const allSessions = sessions.map(({ userId }) => userId);

    const usersData = users.map(
      ({ id, name, email, rootDirId, isDeleted, role }) => ({
        id,
        name,
        email,
        rootDirId,
        isDeleted,
        role,
        isLoggedIn: allSessions.includes(id),
      })
    );

    return res.status(200).json(usersData);
  } catch (error) {
    next(error);
  }
};

export const logoutUserByAdmin = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);

    if (req.user.role <= user.role)
      return res.status(403).json({
        error: "You can only logout users lower than you in role position!",
      });

    if (req.user.id === id)
      return res.status(403).json({ error: "You can not logout yourself!" });

    await Session.find({ userId: id }).then(sessions => {
      sessions.forEach(session => Session.deleteById(session.id));
    });

    return res.status(200).end();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

export const deleteUserByAdmin = async (req, res, next) => {
  const { id } = req.params;

  if (req.user.id === id)
    return res.status(403).json({ error: "You can not delete yourself!" });

  try {
    const user = await User.findById(id);

    if (user.role >= req.user.role)
      return res.status(403).json({
        error: "You can not delete you superior and your self!",
      });

    await User.updateById(id, { isDeleted: true });
    await Session.find({ userId: id }).then(sessions => {
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
  const { id } = req.params;

  if (req.user.id === id)
    return res.status(403).json({ error: "You can not delete yourself!" });

  try {
    const user = await User.findById(id);

    if (user.role >= req.user.role)
      return res.status(403).json({
        error: "You can not delete you superior and your self!",
      });

    await User.deleteById(id);
    await Session.find({ userId: id }).then(sessions => {
      sessions.forEach(session => Session.deleteById(session.id));
    });

    const files = await File.find({ userId: id });

    files.forEach(
      async (file) =>
        await rm(`./storage/${file.id}${file.extension}`)
    );

    await File.find({ userId: id }).then(files => {
      files.forEach(file => File.deleteById(file.id));
    });

    return res.status(200).json({
      message: "User deleted successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const recoverUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    await User.updateById(id, { isDeleted: false });
    res.status(201).end();
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (req, res, next) => {
  const { id } = req.params;

  const role = parseInt(req.headers.role);

  try {
    const user = await User.findById(id);

    if (user.role >= req.user.role) {
      return res.status(403).json({
        error: "Unauthorized change is tried to perform!",
      });
    }

    if (role === 3)
      return res.status(401).json({
        error: "You can not set Owner role!",
      });

    await User.updateById(id, { role });

    return res.status(201).end();
  } catch (error) {
    next(error);
  }
};

export const createAdminUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, password, address, userTypeId, bankName, bankIfscCode, bankAccountNumber, bankAddress, isActive } = req.body;

    if (!firstName || !lastName || !email || !password || !userTypeId) {
      return res.status(400).json({ error: "Missing required fields: firstName, lastName, email, password, userTypeId" });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const userData = {
      firstName,
      lastName,
      phone,
      email,
      password,
      address,
      userTypeId,
      bankName,
      bankIfscCode,
      bankAccountNumber,
      bankAddress,
      isActive: isActive !== undefined ? isActive : true
    };

    const newUser = await User.create(userData);

    return res.status(201).json({
      message: "Admin user created successfully",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        email: newUser.email,
        address: newUser.address,
        userTypeId: newUser.userTypeId,
        bankName: newUser.bankName,
        bankIfscCode: newUser.bankIfscCode,
        bankAccountNumber: newUser.bankAccountNumber,
        bankAddress: newUser.bankAddress,
        isActive: newUser.isActive
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
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      address: user.address,
      userTypeId: user.userTypeId,
      bankName: user.bankName,
      bankIfscCode: user.bankIfscCode,
      bankAccountNumber: user.bankAccountNumber,
      bankAddress: user.bankAddress,
      isActive: user.isActive
    }));
    return res.status(200).json(usersData);
  } catch (error) {
    next(error);
  }
};

export const getAdminUserById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      address: user.address,
      userTypeId: user.userTypeId,
      bankName: user.bankName,
      bankIfscCode: user.bankIfscCode,
      bankAccountNumber: user.bankAccountNumber,
      bankAddress: user.bankAddress,
      isActive: user.isActive
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUser = async (req, res, next) => {
  const { id } = req.params;
  const { firstName, lastName, phone, email, password, address, userTypeId, bankName, bankIfscCode, bankAccountNumber, bankAddress, isActive } = req.body;
  try {
    const user = await User.findById(id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.user.role <= user.role) {
      return res.status(403).json({ error: "Unauthorized to update this user" });
    }
    if (email && email !== user.email) {
      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;
    if (address !== undefined) updateData.address = address;
    if (userTypeId !== undefined) updateData.userTypeId = userTypeId;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (bankIfscCode !== undefined) updateData.bankIfscCode = bankIfscCode;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (bankAddress !== undefined) updateData.bankAddress = bankAddress;
    if (isActive !== undefined) updateData.isActive = isActive;
    const updatedUser = await User.updateById(id, updateData);
    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        email: updatedUser.email,
        address: updatedUser.address,
        userTypeId: updatedUser.userTypeId,
        bankName: updatedUser.bankName,
        bankIfscCode: updatedUser.bankIfscCode,
        bankAccountNumber: updatedUser.bankAccountNumber,
        bankAddress: updatedUser.bankAddress,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createModule = async (req, res, next) => {
  try {
    const { name, parentId, urlSlug, toolTip, description, isActive } = req.body;

    if (!name || !urlSlug) {
      return res.status(400).json({ error: "Missing required fields: name, urlSlug" });
    }

    const existingModule = await AdminModule.findByUrlSlug(urlSlug);
    if (existingModule) {
      return res.status(400).json({ error: "urlSlug already exists" });
    }

    if (parentId) {
      const parentModule = await AdminModule.findById(parentId);
      if (!parentModule) {
        return res.status(400).json({ error: "Invalid parentId" });
      }
    }

    const moduleData = {
      name,
      parentId,
      urlSlug,
      toolTip,
      description,
      isActive: isActive !== undefined ? isActive : true,
      userId: req.user.id
    };

    const newModule = await AdminModule.create(moduleData);

    return res.status(201).json({
      message: "Module created successfully",
      module: {
        id: newModule.id,
        name: newModule.name,
        parentId: newModule.parentId,
        urlSlug: newModule.urlSlug,
        toolTip: newModule.toolTip,
        description: newModule.description,
        isActive: newModule.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllModules = async (req, res, next) => {
  try {
    const modules = await AdminModule.find();
    const modulesData = modules.map(module => ({
      id: module.id,
      name: module.name,
      parentId: module.parentId,
      urlSlug: module.urlSlug,
      toolTip: module.toolTip,
      description: module.description,
      isActive: module.isActive
    }));
    return res.status(200).json(modulesData);
  } catch (error) {
    next(error);
  }
};

export const getModuleById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const module = await AdminModule.findById(id);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }
    return res.status(200).json({
      id: module.id,
      name: module.name,
      parentId: module.parentId,
      urlSlug: module.urlSlug,
      toolTip: module.toolTip,
      description: module.description,
      isActive: module.isActive
    });
  } catch (error) {
    next(error);
  }
};

export const updateModule = async (req, res, next) => {
  const { id } = req.params;
  const { name, parentId, urlSlug, toolTip, description, isActive } = req.body;
  try {
    const module = await AdminModule.findById(id);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    if (urlSlug && urlSlug !== module.urlSlug) {
      const existing = await AdminModule.findByUrlSlug(urlSlug);
      if (existing) {
        return res.status(400).json({ error: "urlSlug already exists" });
      }
    }

    if (parentId && parentId !== module.parentId) {
      const parentModule = await AdminModule.findById(parentId);
      if (!parentModule) {
        return res.status(400).json({ error: "Invalid parentId" });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (urlSlug !== undefined) updateData.urlSlug = urlSlug;
    if (toolTip !== undefined) updateData.toolTip = toolTip;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedModule = await AdminModule.updateById(id, updateData);

    return res.status(200).json({
      message: "Module updated successfully",
      module: {
        id: updatedModule.id,
        name: updatedModule.name,
        parentId: updatedModule.parentId,
        urlSlug: updatedModule.urlSlug,
        toolTip: updatedModule.toolTip,
        description: updatedModule.description,
        isActive: updatedModule.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateModule = async (req, res, next) => {
  const { id } = req.params;
  try {
    const module = await AdminModule.findById(id);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    await AdminModule.updateById(id, { isActive: false });

    return res.status(200).json({
      message: "Module deactivated successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getUserModules = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }

    const userAccesses = await UserAccess.find({ userId, isActive: true });
    const moduleIds = userAccesses.map(access => access.adminModuleId);

    const modules = await AdminModule.find({ id: { in: moduleIds } });
    const modulesData = modules.map(module => ({
      id: module.id,
      name: module.name,
      parentId: module.parentId,
      urlSlug: module.urlSlug,
      toolTip: module.toolTip,
      description: module.description,
      isActive: module.isActive
    }));

    return res.status(200).json(modulesData);
  } catch (error) {
    next(error);
  }
};

export const assignModuleToUser = async (req, res, next) => {
  const { userId, moduleId } = req.body;

  if (!userId || !moduleId) {
    return res.status(400).json({ error: "Missing required fields: userId, moduleId" });
  }

  try {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }

    const module = await AdminModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    const existingAccess = await UserAccess.findOne({ userId, adminModuleId: moduleId, isActive: true });
    if (existingAccess) {
      return res.status(400).json({ error: "Module already assigned to user" });
    }

    const accessData = {
      userId,
      adminModuleId: moduleId,
      createdBy: req.user.id,
      isActive: true
    };

    const newAccess = await UserAccess.create(accessData);

    return res.status(201).json({
      message: "Module assigned to user successfully",
      access: {
        id: newAccess.id,
        userId: newAccess.userId,
        adminModuleId: newAccess.adminModuleId,
        createdBy: newAccess.createdBy,
        isActive: newAccess.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

export const unassignModuleFromUser = async (req, res, next) => {
  const { userId, moduleId } = req.body;

  if (!userId || !moduleId) {
    return res.status(400).json({ error: "Missing required fields: userId, moduleId" });
  }

  try {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }

    const module = await AdminModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    const existingAccess = await UserAccess.findOne({ userId, adminModuleId: moduleId, isActive: true });
    if (!existingAccess) {
      return res.status(400).json({ error: "Module not assigned to user" });
    }

    await UserAccess.updateById(existingAccess.id, { isActive: false });

    return res.status(200).json({
      message: "Module unassigned from user successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const bulkAssignModules = async (req, res, next) => {
  const { userId, moduleIds } = req.body;

  if (!userId || !Array.isArray(moduleIds) || moduleIds.length === 0) {
    return res.status(400).json({ error: "Missing required fields: userId, moduleIds (array)" });
  }

  try {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ error: "User not found" });
    }

    const modules = await AdminModule.find({ id: { in: moduleIds } });
    if (modules.length !== moduleIds.length) {
      return res.status(400).json({ error: "One or more modules not found" });
    }

    const existingAccesses = await UserAccess.find({ userId, adminModuleId: { in: moduleIds }, isActive: true });
    const existingModuleIds = existingAccesses.map(access => access.adminModuleId);
    const newModuleIds = moduleIds.filter(id => !existingModuleIds.includes(id));

    if (newModuleIds.length === 0) {
      return res.status(400).json({ error: "All modules already assigned to user" });
    }

    const accessData = newModuleIds.map(moduleId => ({
      userId,
      adminModuleId: moduleId,
      createdBy: req.user.id,
      isActive: true
    }));

    const newAccesses = await Promise.all(accessData.map(data => UserAccess.create(data)));

    const accessesResponse = newAccesses.map(access => ({
      id: access.id,
      userId: access.userId,
      adminModuleId: access.adminModuleId,
      createdBy: access.createdBy,
      isActive: access.isActive
    }));

    return res.status(201).json({
      message: `${newModuleIds.length} modules assigned to user successfully`,
      accesses: accessesResponse
    });
  } catch (error) {
    next(error);
  }
};
