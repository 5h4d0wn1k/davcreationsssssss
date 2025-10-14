import { createWriteStream } from "fs";
import File from "../models/fileModel.js";
import { extname, normalize } from "path";
import process from "process";
import { rm } from "fs/promises";

export const getFile = async (id) => {
  const file = await File.findOne({
    _id: id,
  }).lean();
  return file;
};

export const fileValidate = async (res, id) => {
  const file = await getFile(id);
  if (!file) {
    return res.status(404).json({
      message: "File not found",
    });
  }
  return { file };
};

export const fetchFile = async (req, res, id, file) => {
  const filepath = `${process.cwd()}/storage/${id}${file?.extention}`;
  if (req.query.action === "download") res.download(filepath, file.name);
  if (file.extention === ".mp4") res.set("Content-Type", `video/mp4`);
  return res.sendFile(normalize(filepath));
};

export const uploadFile = async (req, res, userId, filename, parentDirId) => {
  const extention = extname(filename);

  const insertFile = await File.insertOne({
    parentDirId,
    name: filename,
    extention,
    userId: userId,
  });

  const fullFileName = `${insertFile._id.toString()}${extention}`;
  const writePath = normalize(`${process.cwd()}/storage/${fullFileName}`);
  const writeStream = createWriteStream(writePath);
  req.pipe(writeStream);
  req.on("end", () =>
    res.status(201).json({
      message: "File uploaded successfully",
    })
  );
  req.on("error", () =>
    res.status(400).json({
      error: "Failed to upload file!",
    })
  );
};

export const removeFile = async (res, id, file) => {
  const filePath = normalize(`${process.cwd()}/storage/${id}${file.extention}`);

  await rm(filePath, { recursive: true });
  await File.deleteOne({ _id: id });

  return res.status(200).json({ message: "File deleted successfully." });
};

export const renamefile = async (req, res, id) => {
  await File.updateOne(
    { _id: id },
    { $set: { name: `${req.body.newFilename}` } }
  );
  return res.status(200).json({
    message: "File renamed successfully",
  });
};
