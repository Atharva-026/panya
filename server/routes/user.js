import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

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

router.get("/analytics", async (req, res) => {
  try {
    const { email } = req.query;
    const userId = req.user ? req.user._id : null;

    const match = { status: "paid" };
    if (userId) match.userId = userId;
    else if (email) match.customerEmail = email;
    else return res.status(400).json({ error: "No identity provided" });

    const orders = await Order.find(match).sort({ createdAt: 1 });

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const byDay = {};
    for (const order of orders) {
      if (order.createdAt < since) continue;
      const key = order.createdAt.toISOString().slice(0, 10);
      byDay[key] = (byDay[key] || 0) + order.amount;
    }
    const spendingByDay = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    const products = await Product.find();
    const categoryByProductId = new Map(products.map((p) => [p._id.toString(), p.category]));
    const categoryTotals = {};
    const itemTotals = {};

    for (const order of orders) {
      for (const item of order.items) {
        const category = categoryByProductId.get(item.productId?.toString()) || "Other";
        categoryTotals[category] = (categoryTotals[category] || 0) + item.price * item.qty;

        const key = item.name;
        if (!itemTotals[key]) itemTotals[key] = { name: item.name, unitsBought: 0, spent: 0 };
        itemTotals[key].unitsBought += item.qty;
        itemTotals[key].spent += item.price * item.qty;
      }
    }

    const categoryBreakdown = Object.entries(categoryTotals).map(([category, amount]) => ({ category, amount }));
    const topItems = Object.values(itemTotals)
      .sort((a, b) => b.unitsBought - a.unitsBought)
      .slice(0, 5);

    res.json({ spendingByDay, categoryBreakdown, topItems });
  } catch (err) {
    console.error("User analytics fetch failed:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

export default router;