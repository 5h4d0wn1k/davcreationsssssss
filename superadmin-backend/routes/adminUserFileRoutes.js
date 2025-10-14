import express from "express";
import { isOwner, isOwnerOrAdmin } from "../middlewares/authMiddleware.js";
import {
  deleteUserFile,
  readUserFile,
  renameUserFile,
  uploadUserFile,
} from "../controllers/adminUserFileController.js";

const router = express.Router();

router.get("/read/user/file/:id", isOwnerOrAdmin, readUserFile);

router.post("/upload/user/file/{:parentDirId}", isOwner, uploadUserFile);

router.delete("/delete/user/file/:id", isOwner, deleteUserFile);

router.patch("/rename/user/file/:id", isOwner, renameUserFile);

export default router;
