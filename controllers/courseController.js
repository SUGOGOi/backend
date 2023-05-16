import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Course } from "../models/Course.js";
import getDataUri from "../utils/dataUri.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import cloudinary from "cloudinary";
import { Stats } from "../models/Stats.js";


export const getAllCourses = catchAsyncError(async (req, res, next) => {

  const keyword = req.query.keyword || "";
  const category = req.query.category || "";
  const courses = await Course.find({
    title:{
      $regex:keyword,
      $options:"i" 
    },
    category:{
      $regex:category,
      $options:"i" 
    }
  }).select("-lectures");

 

  res.status(200).json({
    success: true,
    courses,
  });
});

export const createCourse = catchAsyncError(async (req, res, next) => {
  const { title, description, createdBy, category } = req.body;

  if (!title || !description || !createdBy || !category) {
    return next(new ErrorHandler("Please enter all fields!", 400));
  }

  const file = req.file;
  // console.log(file);

  const fileUri = getDataUri(file);
  // console.log(fileUri);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await Course.create({
    title,
    description,
    category,
    createdBy,
    poster: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    message: "Course created successfully.",
  });
});

export const getCourseLectures = catchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    next(new ErrorHandler("Course not found", 404));
  }

  course.views += 1;

  await course.save();

  res.status(200).json({
    success: true,
    lectures: course.lectures,
  });
});

// add lectures max video size 100mb
export const addLectures = catchAsyncError(async (req, res, next) => {
  const { title, description } = req.body;
  const file = req.file;
  const fileUri = getDataUri(file);

  const course = await Course.findById(req.params.id);
  if (!course) {
    next(new ErrorHandler("Course not found", 404));
  }

  // console.log(course);

  if (!title || !description || !file) {
    next(new ErrorHandler("Please enter all fields"));
  }
  //upload to cloudinary
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });

  if (!mycloud) {
    next(
      new ErrorHandler("Failed to upload, Check Your Internet Connection!", 400)
    );
  }

  course.lectures.push({
    title,
    description,
    videos: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  course.numOfVideos = course.lectures.length;

  await course.save();
  res.status(200).json({
    success: true,
    message: "Lecture uploaded successfully",
  });
});

export const deleteCourse = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) {
    next(new ErrorHandler("Course not found", 404));
  }

  await cloudinary.v2.uploader.destroy(course.poster.public_id);
  // console.log("done");

  for (let i = 0; i < course.lectures.length; i++) {
    const singleLecture = course.lectures[i];

    await cloudinary.v2.uploader.destroy(singleLecture.videos.public_id, {
      resource_type: "video",
    });
    // console.log("done");
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
});

export const deleteLecture = catchAsyncError(async (req, res, next) => {
  const { courseId, lectureId } = req.query;
  const course = await Course.findById(courseId);

  if (!course) {
    next(new ErrorHandler("Course not found", 404));
  }

  const lecture = course.lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) return item;
  });

  if (!lecture) {
    next(new ErrorHandler("Lecture not found", 404));
  }

  await cloudinary.v2.uploader.destroy(lecture.videos.public_id, {
    resource_type: "video",
  });

  course.lectures = course.lectures.filter((item) => {
    if (item._id.toString() !== lectureId.toString()) return item;
  });

  course.numOfVideos -= 1;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture Deleted Successfully",
  });
});


Course.watch().on("change",async () =>{
  const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(1);

  const courses = await Course.find({});

  totalViews=0;

  for(let i =0;i<courses.length;i++){
    const course = courses[i];
    totalViews += course.views

  }

  stats[0].views = totalViews;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
})
