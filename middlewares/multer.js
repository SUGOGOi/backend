import multer from "multer";

const storage = multer.memoryStorage();

const singleUpload = multer({ storage }).single("File");

console.log("done")

export default singleUpload;
