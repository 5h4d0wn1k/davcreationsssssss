import { rm } from "fs/promises";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";

export const getDirData = async (dirData, res) => {
  if (!dirData)
    return res.status(404).json({ message: "Directory not found!" });

  const directories = await Directory.find({
    parentDirId: dirData._id,
  })
    .lean()
    .sort({ name: 1 });
  const files = await File.find({
    parentDirId: dirData._id,
  })
    .lean()
    .sort({ name: 1 });
  return res.status(200).json({
    ...dirData,
    files: files.map((file) => ({ ...file, id: file._id })),
    directories: directories.map((dir) => ({ ...dir, id: dir._id })),
  });
};

export const createDir = async (req, res, userId, parentDirId) => {
  const dirname = req.headers.dirname || "New Folder";

  await Directory.insertOne({
    name: dirname,
    parentDirId,
    userId,
  });

  return res.status(201).json({
    message: "Folder created successfully",
  });
};

export const renameDir = async (req, res, id) => {
  await Directory.updateOne(
    { _id: id },
    { $set: { name: req.body.newDirName || "New Folder" } }
  );
  return res.status(201).json({ message: "Directory renamed successfully" });
};

export const deleteDir = async (res, id) => {
  const { files, directories } = await getDirectoryContents(id);

  for (const { _id, extention } of files) {
    await rm(`./storage/${_id.toString()}${extention}`);
  }

  await File.deleteMany({
    _id: { $in: files.map(({ _id }) => _id) },
  });

  await Directory.deleteMany({
    _id: { $in: [...directories.map(({ _id }) => _id), id] },
  });

  return res.json({ message: "Directory deleted successfully" });
};

export const getDirectoryContents = async (id) => {
  let files = await File.find({ parentDirId: id }).select("extention").lean();

  let directories = await Directory.find({ parentDirId: id })
    .select("_id")
    .lean();

  for (const { _id } of directories) {
    const { files: childFiles, directories: childDirectories } =
      await getDirectoryContents(_id);

    files = [...files, ...childFiles];
    directories = [...directories, ...childDirectories];
  }

  return { files, directories };
};

export const getDirectory = async (id) => {
  const directory = await Directory.findById(id).lean();
  return directory;
};

export const validateDirectory = async (res, dirId) => {
  const directory = await getDirectory(dirId);
  if (!directory)
    return res.status(404).json({
      error: "Parent dir not found!",
    });
  return { directory };
};
