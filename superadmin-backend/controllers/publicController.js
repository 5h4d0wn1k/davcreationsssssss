import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import {
  getDirData,
  getDirectoryContents,
  validateDirectory,
} from "../utils/directoryUtils.js";
import { fetchFile, fileValidate } from "../utils/fileUtils.js";

export const getDirectoryData = async (req, res, next) => {
  const { id } = req.params;
  try {
    const dirData = await Directory.findById(id).lean();

    if (!dirData.isPublic)
      return res.status(400).json({ error: "Directory is not publiced!" });

    const data = await getDirData(dirData, res);
    return data;
  } catch (error) {
    next(error);
  }
};

export const makeDirectoryPublic = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { directory } = await validateDirectory(res, id);

    if (directory.userId.toString() !== req.user._id.toString())
      return res.status(401).json({ error: "Unauthorized operation!" });

    const { files, directories } = await getDirectoryContents(id);

    await File.updateMany(
      {
        _id: { $in: files.map(({ _id }) => _id) },
      },
      { isPublic: true }
    );

    await Directory.updateMany(
      {
        _id: { $in: [...directories.map(({ _id }) => _id), id] },
      },
      { isPublic: true }
    );

    return res.status(201).json({
      message: "Directory publiced successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const makeDirectoryUnPublic = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { directory } = await validateDirectory(res, id);

    if (directory.userId.toString() !== req.user._id.toString())
      return res.status(401).json({ error: "Unauthorized operation!" });

    const { files, directories } = await getDirectoryContents(id);

    await File.updateMany(
      {
        _id: { $in: files.map(({ _id }) => _id) },
      },
      { isPublic: false }
    );

    await Directory.updateMany(
      {
        _id: { $in: [...directories.map(({ _id }) => _id), id] },
      },
      { isPublic: false }
    );

    return res.status(201).json({
      message: "Directory unpubliced successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const readPublicFile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const file = await File.findById(id).lean().select("extention isPublic");

    if (!file) return res.status(404).json({ error: "File not found!" });

    if (!file.isPublic)
      return res.status(403).json({
        error: "Access denied. This is not a public file!",
      });

    const response = await fetchFile(req, res, id, file);
    return response;
  } catch (error) {
    next(error);
  }
};

export const makeFilePublic = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { file } = await fileValidate(res, id);

    if (file.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Unauthorized Operation!" });

    await File.findByIdAndUpdate(id, { isPublic: true });

    return res.status(200).json({
      message: "File publiced successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const makeFileUnPublic = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { file } = await fileValidate(res, id);

    if (file.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Unauthorized Operation!" });

    await File.findByIdAndUpdate(id, { isPublic: false });

    return res.status(200).json({
      message: "File publiced successfully!",
    });
  } catch (error) {
    next(error);
  }
};
