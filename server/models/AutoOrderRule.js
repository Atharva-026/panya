import mongoose from "mongoose";

const autoOrderRuleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  goal: { type: String, required: true }, // e.g. "casual wear under 1000 rupees"
  budget: { type: Number, required: true },
  frequency: { type: String, enum: ["weekly", "monthly"], required: true },
  active: { type: Boolean, default: true },
  authorized: { type: Boolean, default: false },
  nextRunDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("AutoOrderRule", autoOrderRuleSchema);