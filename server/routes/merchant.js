import express from "express";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import MerchantRule from "../models/MerchantRule.js";

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const paidOrders = await Order.find({ status: "paid" });

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
    const upsellOrders = paidOrders.filter((o) => o.isUpsell);
    const upsellRevenue = upsellOrders.reduce((sum, o) => sum + o.amount, 0);

    const recentAuditLogs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(20);

    const rules = await MerchantRule.findOne();

    res.json({
      totalRevenue,
      totalOrders: paidOrders.length,
      upsellRevenue,
      upsellOrderCount: upsellOrders.length,
      recentAuditLogs,
      merchantRules: rules,
    });
  } catch (err) {
    console.error("Dashboard fetch failed:", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

export default router;