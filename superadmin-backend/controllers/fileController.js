import File from "../models/fileModel.js";
import {
  fetchFile,
  fileValidate,
  removeFile,
  renamefile,
  uploadFile,
} from "../utils/fileUtils.js";
import { validateDirectory } from "../utils/directoryUtils.js";

export const createFile = async (req, res, next) => {
  const filename = req.headers.filename || "untitled";
  const parentDirId = req.params.parentDirId || req.user.rootDirId.toString();

  try {
    const { directory: parentDir } = await validateDirectory(res, parentDirId);

    if (parentDir.userId.toString() !== req.user._id.toString())
      return res.status(401).json({ error: "Unauthorized operation!" });

    const response = await uploadFile(
      req,
      res,
      req.user._id,
      filename,
      parentDirId
    );

    return response;
  } catch (error) {
    next(error);
  }
};

export const readFile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { file } = await fileValidate(res, id);

    if (file.userId.toString() !== req.user._id.toString())
      return res.status(401).json({ error: "Unauthorized access!" });

    const response = await fetchFile(req, res, id, file);
    return response;
  } catch (err) {
    next(err);
  }
};

export const deleteFile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { file } = await fileValidate(res, id);

    if (file.userId.toString() !== req.user._id.toString())
      return res.status(404).json({ error: "Unauthorized operation!" });

    const response = await removeFile(res, id, file);
    return response;
  } catch (error) {
    next(error);
  }
};

export const renameFile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { file } = await fileValidate(res, id);

    if (file.userId.toString() !== req.user._id.toString())
      return res.status(401).json({ error: "Unauthorized Opreation!" });

    const response = await renamefile(req, res, id);
    return response;
  } catch (error) {
    error.status = 500;
    next(error);
  }
};
