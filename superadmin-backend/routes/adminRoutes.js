import express from "express";
import {
  changeUserRole,
  deleteUserByAdmin,
  getAllUsers,
  hardDeleteUserByAdmin,
  logoutUserByAdmin,
  recoverUser,
  createAdminUser,
  getAllAdminUsers,
  getAdminUserById,
  updateAdminUser,
  createModule,
  getAllModules,
  getModuleById,
  updateModule,
  deactivateModule,
  getUserModules,
  assignModuleToUser,
  unassignModuleFromUser,
  bulkAssignModules,
} from "../controllers/adminController.js";
import {
  CheckAuth,
  isAdmin,
  isAdminOrManager,
  isOwner,
  isOwnerOrAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/users", CheckAuth, isAdminOrManager, getAllUsers);

router.post(
  "/admin/logout/user/:id",
  CheckAuth,
  isAdminOrManager,
  logoutUserByAdmin
);

router.delete("/admin/delete/user/:id", CheckAuth, isAdmin, deleteUserByAdmin);

router.delete(
  "/admin/hard/delete/user/:id",
  CheckAuth,
  isAdmin,
  hardDeleteUserByAdmin
);

router.patch("/admin/recover/user/:id", CheckAuth, isOwner, recoverUser);

router.patch(
  "/admin/change/role/user/:id",
  CheckAuth,
  isAdminOrManager,
  changeUserRole
);

// User management endpoints
router.post("/admin/users", CheckAuth, isAdmin, createAdminUser);
router.get("/admin/users/all", CheckAuth, isAdminOrManager, getAllAdminUsers);
router.get("/admin/users/:id", CheckAuth, isAdminOrManager, getAdminUserById);
router.put("/admin/users/:id", CheckAuth, isAdmin, updateAdminUser);

// Module management endpoints
router.post("/admin/modules", CheckAuth, isAdmin, createModule);
router.get("/admin/modules", CheckAuth, isAdminOrManager, getAllModules);
router.get("/admin/modules/:id", CheckAuth, isAdminOrManager, getModuleById);
router.put("/admin/modules/:id", CheckAuth, isAdmin, updateModule);
router.patch("/admin/modules/:id/deactivate", CheckAuth, isAdmin, deactivateModule);

// Roles & permissions assignment endpoints
router.get("/admin/users/:userId/modules", CheckAuth, isAdminOrManager, getUserModules);
router.post("/admin/assign/module", CheckAuth, isAdmin, assignModuleToUser);
router.post("/admin/unassign/module", CheckAuth, isAdmin, unassignModuleFromUser);
router.post("/admin/bulk/assign/modules", CheckAuth, isAdmin, bulkAssignModules);

export default router;
