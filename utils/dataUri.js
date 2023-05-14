import DataUriParser from "datauri/parser.js";
import path from "path";

const getDataUri = (File) => {
  const parser = new DataUriParser();
  const extName = path.extname(File.originalname).toString();

  return parser.format(extName, File.buffer);
};

export default getDataUri;
