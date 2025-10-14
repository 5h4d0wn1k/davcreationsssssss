import { rm } from "fs/promises";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import {
  createDir,
  deleteDir,
  getDirData,
  getDirectory,
  renameDir,
} from "../utils/directoryUtils.js";

export const createDirectory = async (req, res, next) => {
  const parentDirId = req.params.parentDirId || req.user.rootDirId.toString();

  try {
    const parentDir = await getDirectory(parentDirId);

    if (!parentDir)
      return res.status(404).json({
        error: "Directory not found!",
      });

    if (parentDir?.userId.toString() !== req.user._id.toString())
      return res.status(401).json({ error: "Unauthorized access!" });

    const response = await createDir(req, res, req.user._id, parentDirId);
    return response;
  } catch (error) {
    next(error);
  }
};

export const readDirectory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const directoryData = id
      ? await Directory.findById(id).lean()
      : await Directory.findById(req.user.rootDirId).lean();

    if (directoryData?.userId.toString() !== req.user._id.toString())
      return res.status(401).json({ error: "Unauthorized access!" });

    const dirData = await getDirData(directoryData, res);
    return dirData;
  } catch (error) {
    next(error);
  }
};

export const renameDirectory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const directoryData = await getDirectory(id);

    if (!directoryData) return res.status(404).json({ message: "Not found!" });

    if (directoryData?.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Unauthorized access!" });

    const response = await renameDir(req, res, id);
    return response;
  } catch (error) {
    next(error);
  }
};

export const deleteDirectory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const dir = await getDirectory(id);

    if (!dir)
      return res.status(404).json({
        error: "Directory not found!",
      });

    if (dir?.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Unauthorized access!" });

    const response = await deleteDir(res, id);
    return response;
  } catch (error) {
    next(error);
  }
};
