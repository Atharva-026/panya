import mongoose from "mongoose";

const merchantInsightSchema = new mongoose.Schema({
  generatedAt: { type: Date, default: Date.now },
  narrative: [{ type: String }],
  spikeAlert: {
    triggered: { type: Boolean, default: false },
    message: { type: String, default: "" },
  },
});

export default mongoose.model("MerchantInsight", merchantInsightSchema);