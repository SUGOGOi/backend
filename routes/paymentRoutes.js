import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  buySubscription,
  cancelSubscription,
  getRazorpayKey,
  payemntVerification,
} from "../controllers/paymentController.js";

const router = express.Router();

//buy subscription
router.route("/subscribe").get(isAuthenticated, buySubscription);

//paymentverification and reference in db
router.route("/paymentverification").post(isAuthenticated, payemntVerification);

//get razorpaykey
router.route("/razorpaykey").get(getRazorpayKey);

//cancel subscription
router.route("/subscribe/cancel").delete(isAuthenticated, cancelSubscription);

export default router;
