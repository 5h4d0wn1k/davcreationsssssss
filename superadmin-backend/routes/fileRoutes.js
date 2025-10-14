import express from "express";
import { checkParams } from "../middlewares/validageParamsMiddleware.js";
import {
  createFile,
  deleteFile,
  readFile,
  renameFile,
} from "../controllers/fileController.js";

const router = express.Router();

router.param("parentDirId", checkParams);
router.param("id", checkParams);

router.post("/{:parentDirId}", createFile);

router.get("/:id", readFile);

router.delete("/:id", deleteFile);

router.patch("/:id", renameFile);

export default router;
