import express from "express";
import { checkParams } from "../middlewares/validageParamsMiddleware.js";
import {
  createDirectory,
  deleteDirectory,
  readDirectory,
  renameDirectory,
} from "../controllers/directoryController.js";

const router = express.Router();

router.param("parentDirId", checkParams);
router.param("id", checkParams);

router.post("/{:parentDirId}", createDirectory);

router.get("/{:id}", readDirectory);

router.patch("/:id", renameDirectory);

router.delete("/:id", deleteDirectory);

export default router;
