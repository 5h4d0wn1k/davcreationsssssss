import express from "express";
import { isOwner, isOwnerOrAdmin } from "../middlewares/authMiddleware.js";
import {
  createUserDir,
  deleteUserDir,
  readUserDirData,
  renameUserDir,
} from "../controllers/adminUserDirectoryController.js";

const router = express.Router();

router.get("/get/user/data/:id", isOwnerOrAdmin, readUserDirData);

router.post("/create/user/dir/{:parentDirId}", isOwner, createUserDir);

router.patch("/rename/user/dir/:id", isOwner, renameUserDir);

router.delete("/delete/user/dir/:id", isOwner, deleteUserDir);

export default router;
