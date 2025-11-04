import express from "express";
import { adminLimiter } from "../middlewares/rateLimitMiddleware.js";
import {
  changeUserRole,
  deleteUserByAdmin,
  getAllUsers,
  hardDeleteUserByAdmin,
  logoutUserByAdmin,
  recoverUser,
  createUser,
  getUserById,
  updateUser,
  createModule,
  getAllModules,
  getModuleById,
  updateModule,
  deactivateModule,
  getUserModules,
  assignModuleToUser,
  unassignModuleFromUser,
  createUserType,
  getAllUserTypes,
  getUserTypeById,
  updateUserType,
  deleteUserType,
} from "../controllers/adminController.js";
import {
  CheckAuth,
  isAdmin,
  isAdminOrManager,
  isOwner,
} from "../middlewares/authMiddleware.js";
import {
  validateRequest,
  changeUserRoleSchema,
  createAdminUserSchema,
  updateUserSchema,
  createModuleSchema,
  updateModuleSchema,
  assignModuleToUserSchema,
  unassignModuleFromUserSchema,
  createUserTypeSchema,
  updateUserTypeSchema,
} from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.get("/users", adminLimiter, CheckAuth, isAdminOrManager, getAllUsers);

router.post(
  "/admin/logout/user/:id",
  adminLimiter,
  CheckAuth,
  isAdminOrManager,
  logoutUserByAdmin
);

router.delete("/admin/delete/user/:id", adminLimiter, CheckAuth, isAdmin, deleteUserByAdmin);

router.delete(
  "/admin/hard/delete/user/:id",
  adminLimiter,
  CheckAuth,
  isAdmin,
  hardDeleteUserByAdmin
);

router.patch("/admin/recover/user/:id", adminLimiter, CheckAuth, isOwner, recoverUser);

router.patch(
  "/admin/change/usertype/user/:id",
  adminLimiter,
  CheckAuth,
  isAdminOrManager,
  validateRequest(changeUserRoleSchema),
  changeUserRole
);

// User management endpoints
router.post("/admin/users", adminLimiter, CheckAuth, isAdmin, validateRequest(createAdminUserSchema), createUser);
router.get("/admin/users/all", adminLimiter, CheckAuth, isAdminOrManager, getAllUsers);
router.get("/admin/users/:id", adminLimiter, CheckAuth, isAdminOrManager, getUserById);
router.put("/admin/users/:id", adminLimiter, CheckAuth, isAdmin, validateRequest(updateUserSchema), updateUser);

// Module management endpoints
router.post("/admin/modules", adminLimiter, CheckAuth, isAdmin, validateRequest(createModuleSchema), createModule);
router.get("/admin/modules", adminLimiter, CheckAuth, isAdminOrManager, getAllModules);
router.get("/admin/modules/:id", adminLimiter, CheckAuth, isAdminOrManager, getModuleById);
router.put("/admin/modules/:id", adminLimiter, CheckAuth, isAdmin, validateRequest(updateModuleSchema), updateModule);
router.patch("/admin/modules/:id/deactivate", adminLimiter, CheckAuth, isAdmin, deactivateModule);

// Roles & permissions assignment endpoints
router.get("/admin/users/:userId/modules", adminLimiter, CheckAuth, isAdminOrManager, getUserModules);
router.post("/admin/assign/module", adminLimiter, CheckAuth, isAdmin, validateRequest(assignModuleToUserSchema), assignModuleToUser);
router.post("/admin/unassign/module", adminLimiter, CheckAuth, isAdmin, validateRequest(unassignModuleFromUserSchema), unassignModuleFromUser);

// UserType management endpoints
router.post("/admin/user-types", adminLimiter, CheckAuth, isOwner, validateRequest(createUserTypeSchema), createUserType);
router.get("/admin/user-types", adminLimiter, CheckAuth, isOwner, getAllUserTypes);
router.get("/admin/user-types/:user_type_id", adminLimiter, CheckAuth, isOwner, getUserTypeById);
router.put("/admin/user-types/:user_type_id", adminLimiter, CheckAuth, isOwner, validateRequest(updateUserTypeSchema), updateUserType);
router.delete("/admin/user-types/:user_type_id", adminLimiter, CheckAuth, isOwner, deleteUserType);

export default router;
