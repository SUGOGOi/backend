import express from "express";
import {
  createCourse,
  getCourseLectures,
  getAllCourses,
  addLectures,
  deleteCourse,
  deleteLecture,
} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import { authorizedAdmin, authorizedSubscribers, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

//get all courses without lectures;
router.route("/courses").get(getAllCourses);

//create course -only admin
router
  .route("/createcourse")
  .post(isAuthenticated, authorizedAdmin, singleUpload, createCourse);

//add lectures,delete course, get course details - only admin
router
  .route("/course/:id")
  .get(isAuthenticated,authorizedSubscribers, getCourseLectures)
  .post(isAuthenticated, authorizedAdmin, singleUpload, addLectures)
  .delete(isAuthenticated, authorizedAdmin, deleteCourse);

//delete lecture
router
  .route("/lecture")
  .delete(isAuthenticated, authorizedAdmin, deleteLecture);

export default router;
