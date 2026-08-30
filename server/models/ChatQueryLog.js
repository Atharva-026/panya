import mongoose from "mongoose";

const chatQueryLogSchema = new mongoose.Schema({
  message: { type: String, required: true },
  matched: { type: Boolean, default: false },
  matchedProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("ChatQueryLog", chatQueryLogSchema);