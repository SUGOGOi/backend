import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import { Stats } from "../models/Stats.js";

//register
export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  const file = req.file;

  console.log(file)


  const fileUri = getDataUri(file);

  if (!name || !email || !password || !file) {
    return next(new ErrorHandler("Please enter all fields!", 400));
  }


  let user = await User.findOne({ email });

  if (user) {
    next(new ErrorHandler("User already exist!", 409));
  }

  //upload file on cloudinary
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  sendToken(res, user, "Registered susscesfully", 201);
});

//login
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new ErrorHandler("Please enter your email/password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    next(new ErrorHandler("Incorrect Email or Password", 401));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    next(new ErrorHandler("Incorrect Email or Password", 401));
  }

  sendToken(res, user, `Welcome back ${user.name}`, 200);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({
      success: true,
      message: "Logout successfully",
    });
});

//get MY Profile
export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

//change password

export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    next(new ErrorHandler("Please enter all field", 400));
  }

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) {
    next(new ErrorHandler("Incorrect Old Password", 400));
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Updated Successfully",
  });
});

//update Profile
export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;
  if (!name && !email) {
    next(new ErrorHandler("Please enter atlest one field", 400));
  }

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile details updated successfully",
  });
});

//update profile picture
export const updateProfilePicture = catchAsyncError(async (req, res, next) => {
  const file = req.file;

  if (!file) {
    next(new ErrorHandler("Select an avatar!", 400));
  }

  const user = await User.findById(req.user._id);

  const fileUri = getDataUri(file);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user.avatar = {
    public_id: mycloud.public_id,
    url: mycloud.secure_url,
  };

  await user.save();
  res.status(200).json({
    success: true,
    message: "Profile picture updated successfully",
  });
});

//forgot password
export const forgetPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    next(new ErrorHandler("Enter email", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    next(new ErrorHandler("User not found", 400));
  }

  //http://localhost:3000/resetpassword/token

  const resetToken = await user.getResetToken();

  await user.save();

  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `Click on the link to reset your password ${url}. If you have not requested then please ignore.`;

  //send token via email
  await sendEmail(user.email, `CCSA Reset Password`, message);

  res.status(200).json({
    success: true,
    message: `Reset link has been send to ${user.email}`,
  });
});

//reset password
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  // console.log(token);

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    next(new ErrorHandler("Link is invalid or has been expired", 401));
  }

  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

export const addToPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.body._id);

  if (!course) {
    next(new ErrorHandler("Invalid course Id", 404));
  }

  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) return true;
  });
  if (itemExist)
    return next(new ErrorHandler("Already added to playlist", 409));

  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Course added to playlist",
  });
});

export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.query.id);

  if (!course) {
    return next(new ErrorHandler("Invalid course Id", 404));
  }

  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) {
    }
  });

  user.playlist = newPlaylist;

  await user.save();
  res.status(200).json({
    success: true,
    message: "Course removed to playlist",
  });
});

//admin routes
//get all users

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({
    success: true,
    users,
  });
});

//change role
export const updateUserRole = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    next(new ErrorHandler("User not found", 404));
  }

  if (user.role === "user") {
    user.role = "admin";
  } else {
    user.role = "user";
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Role Updated",
  });
});

//delete user  //delete admin+course TODO
export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    next(new ErrorHandler("User not found", 404));
  }

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  await user.deleteOne();

  //cancel subscription

  res.status(200).json({
    success: true,
    message: "User Deleted",
  });
});

//delete user me
export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    next(new ErrorHandler("User not found", 404));
  }

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  await user.deleteOne();

  //cancel subscription

  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "User Deleted",
    });
});

User.watch().on("change",async() =>{
  const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(1);


  const subscription = await User.find({"subscription.status":"active"})
  console.log(subscription)

  stats[0].subscriptions = subscription.length;
  stats[0].users = await User.countDocuments();
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
})
