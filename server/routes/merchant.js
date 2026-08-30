import express from "express";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import MerchantRule from "../models/MerchantRule.js";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/rules", async (req, res) => {
  const rules = await MerchantRule.findOne();
  res.json(rules);
});

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

router.post("/products", async (req, res) => {
  try {
    const { name, price, category, stock, description, style, color, material, imageUrl } = req.body || {};
    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: "name, price, and category are required" });
    }

    const product = await Product.create({
      name,
      price,
      category,
      stock: stock ?? 20,
      description: description || "",
      style: style || "",
      color: color || "",
      material: material || "",
      imageUrl: imageUrl || "",
    });

    res.json(product);
  } catch (err) {
    console.error("Product creation failed:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const { name, price, category, stock, description, style, color, material, imageUrl } = req.body || {};
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, category, stock, description, style, color, material, imageUrl },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Product update failed:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Product deletion failed:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;