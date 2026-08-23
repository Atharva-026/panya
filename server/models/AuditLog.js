import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: String,       // e.g. "order_created", "order_blocked", "payment_failed"
  reason: String,       // explanation the agent gives
  orderRef: mongoose.Schema.Types.ObjectId,
  amount: Number,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("AuditLog", auditLogSchema);