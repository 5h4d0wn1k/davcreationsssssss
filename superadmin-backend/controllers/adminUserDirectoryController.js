import Directory from "../models/directoryModel.js";
import User from "../models/userModel.js";
import {
  createDir,
  deleteDir,
  getDirData,
  getDirectory,
  renameDir,
} from "../utils/directoryUtils.js";

export const readUserDirData = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({ rootDirId: id }).lean();

    if (user)
      if (req.user.role <= user?.role)
        return res.status(403).json({ error: "Access not allowed!" });

    const dirData = await Directory.findById(id).lean();

    const directoryData = await getDirData(dirData, res);

    return directoryData;
  } catch (error) {
    next(error);
  }
};

export const createUserDir = async (req, res, next) => {
  const parentDirId = req.params.parentDirId;

  try {
    const parentDir = await getDirectory(parentDirId);

    if (!parentDir)
      return res.status(404).json({
        error: "Directory not found!",
      });

    const response = await createDir(req, res, parentDir.userId, parentDirId);

    return response;
  } catch (error) {
    next(error);
  }
};

export const renameUserDir = async (req, res, next) => {
  try {
    const { id } = req.params;
    const directoryData = await getDirectory(id);

    if (!directoryData) return res.status(404).json({ message: "Not found!" });

    const response = await renameDir(req, res, id);
    return response;
  } catch (error) {
    next(error);
  }
};

export const deleteUserDir = async (req, res, next) => {
  const { id } = req.params;

  try {
    const dir = await getDirectory(id);

    console.log(dir);

    if (!dir)
      return res.status(404).json({
        error: "Directory not found!",
      });

    const response = await deleteDir(res, id);
    return response;
  } catch (error) {
    next(error);
  }
};
