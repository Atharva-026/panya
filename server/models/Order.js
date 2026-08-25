import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  razorpayOrderId: String,
  razorpayPaymentId: String,
  items: [{ productId: mongoose.Schema.Types.ObjectId, name: String, price: Number, qty: Number }],
  amount: Number,
  status: { type: String, enum: ["created", "paid", "failed", "blocked"], default: "created" },
  isUpsell: { type: Boolean, default: false },
  customerName: { type: String, default: "" },
  customerEmail: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);