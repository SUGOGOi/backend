import multer from "multer";

const storage = multer.memoryStorage();

const singleUpload = multer({ storage }).single("File");

export default singleUpload;
