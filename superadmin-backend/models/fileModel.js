import { model, Schema } from "mongoose";

const fileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    parentDirId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Directory",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      select: "name email",
    },
    extention: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    strict: "throw",
    versionKey: false,
  }
);

const File = model("File", fileSchema);

export default File;
