import express from "express";
import {
  register,
  login,
  logout,
  getMyProfile,
  changePassword,
  updateProfile,
  updateProfilePicture,
  forgetPassword,
  resetPassword,
  addToPlaylist,
  removeFromPlaylist,
  getAllUsers,
  updateUserRole,
  deleteUser,
  deleteMyProfile,
} from "../controllers/userController.js";
import { authorizedAdmin, isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";

const router = express.Router();

//register new user
router.route("/register").post(singleUpload, register);

//login user
router.route("/login").post(login);

//logout user
router.route("/logout").get(logout);

//get my profile
router.route("/me").get(isAuthenticated, getMyProfile);

//delete my profile
router.route("/me").delete(isAuthenticated, deleteMyProfile);

//change password
router.route("/changepassword").put(isAuthenticated, changePassword);

//update profile
router.route("/updateprofile").put(isAuthenticated, updateProfile);

//update profile picture
router
  .route("/updateprofilepicture")
  .put(isAuthenticated, singleUpload, updateProfilePicture);

//forgot password
router.route("/forgetpassword").post(forgetPassword);

//reset password
router.route("/resetpassword/:token").put(resetPassword);

//add course to playlist
router.route("/addtoplaylist").post(isAuthenticated, addToPlaylist);

//remove from playlist
router.route("/removefromplaylist").delete(isAuthenticated, removeFromPlaylist);

//ADMIN ROUTES
router.route("/admin/users").get(isAuthenticated, authorizedAdmin, getAllUsers);

router
  .route("/admin/user/:id")
  .put(isAuthenticated, authorizedAdmin, updateUserRole)
  .delete(isAuthenticated, authorizedAdmin, deleteUser);

export default router;
