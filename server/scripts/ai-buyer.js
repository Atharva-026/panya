import dotenv from "dotenv";
import mongoose from "mongoose";
import { runAutonomousPurchase } from "../utils/aiBuyer.js";
dotenv.config();

const GOAL = process.argv[2] || "I need something for a formal wedding, budget conscious";
const BUDGET = Number(process.argv[3]) || 5000;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`AI Buyer Agent starting. Goal: "${GOAL}", Budget: ₹${BUDGET}\n`);

  const result = await runAutonomousPurchase(GOAL, BUDGET, null, {});

  if (!result.success) {
    console.log(`Could not complete purchase: ${result.reason}`);
  } else {
    console.log(`Agent decision: ${result.decision.reasoning}`);
    console.log(`Order created: ${result.order.razorpayOrderId}, amount: ₹${result.order.amount / 100}`);
  }

  process.exit();
}

run().catch((err) => console.error("AI Buyer failed:", err));