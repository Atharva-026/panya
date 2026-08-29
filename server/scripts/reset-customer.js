import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
dotenv.config();

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.updateMany({}, { razorpayCustomerId: null, savedPaymentToken: null });
  console.log("Cleared cached Razorpay customer IDs for all users");
  process.exit();
}
reset();