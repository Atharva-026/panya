import mongoose from "mongoose";
import dotenv from "dotenv";
import MerchantRule from "../models/MerchantRule.js";

dotenv.config();

async function update() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await MerchantRule.updateOne({}, { dailySpendCap: 3000 });
    console.log("Daily spend cap updated to ₹3000 for testing");
  } finally {
    await mongoose.disconnect();
  }
}

update().catch((err) => {
  console.error("Failed to update merchant rules:", err);
  process.exitCode = 1;
});
