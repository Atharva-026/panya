import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

router.get("/orders", async (req, res) => {
  try {
    const { email } = req.query;
    const userId = req.user ? req.user._id : null;

    let orders;
    if (userId) {
      orders = await Order.find({ userId, status: "paid" }).sort({ createdAt: -1 });
    } else if (email) {
      orders = await Order.find({ customerEmail: email, status: "paid" }).sort({ createdAt: -1 });
    } else {
      return res.status(400).json({ error: "No identity provided" });
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);

    res.json({ orders, totalSpent, orderCount: orders.length });
  } catch (err) {
    console.error("User orders fetch failed:", err);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

export default router;
