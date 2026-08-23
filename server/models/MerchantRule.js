import mongoose from "mongoose";

const merchantRuleSchema = new mongoose.Schema({
  maxOrderValue: { type: Number, default: 5000 },
  dailySpendCap: { type: Number, default: 15000 },
});

export default mongoose.model("MerchantRule", merchantRuleSchema);