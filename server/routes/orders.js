import crypto from "crypto";
import express from "express";
import Razorpay from "razorpay";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import MerchantRule from "../models/MerchantRule.js";

const router = express.Router();

function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function createOrderForItems(items, customer = {}, userId = null) {
  const rules = await MerchantRule.findOne();
  let amount = 0;
  const orderItems = [];

  for (const { productId, qty } of items) {
    const product = await Product.findById(productId);
    if (!product) throw new Error(`Product not found: ${productId}`);
    amount += product.price * qty;
    orderItems.push({ productId: product._id, name: product.name, price: product.price, qty });
  }

  if (amount > rules.maxOrderValue) {
    await AuditLog.create({
      action: "order_blocked",
      reason: `Order amount ₹${amount} exceeds max allowed ₹${rules.maxOrderValue}`,
      amount,
    });
    return {
      blocked: true,
      reason: `This order exceeds the ₹${rules.maxOrderValue} limit, so I can't complete it automatically.`,
    };
  }

  const razorpay = getRazorpayInstance();
  const rzpOrder = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  const order = await Order.create({
    razorpayOrderId: rzpOrder.id,
    items: orderItems,
    amount,
    status: "created",
    isUpsell: items.length > 1,
    customerName: customer.name || "",
    customerEmail: customer.email || "",
    userId,
  });

  await AuditLog.create({
    action: "order_created",
    reason: `Order created for ${orderItems.map((item) => item.name).join(", ")}`,
    orderRef: order._id,
    amount,
  });

  return {
    razorpayOrderId: rzpOrder.id,
    amount: amount * 100,
    keyId: process.env.RAZORPAY_KEY_ID,
    dbOrderId: order._id,
  };
}

router.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

router.post("/create", async (req, res) => {
  try {
    const { productId, qty = 1, customer = {} } = req.body || {};
    if (!productId) return res.status(400).json({ error: "productId is required" });

    const result = await createOrderForItems([{ productId, qty }], customer);
    if (result.blocked) return res.status(403).json(result);
    res.json(result);
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing verification fields" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      await AuditLog.create({
        action: "payment_verification_failed",
        reason: "Signature mismatch — possible tampering or invalid request",
      });
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: "paid", razorpayPaymentId: razorpay_payment_id },
      { returnDocument: "after" }
    );

    await AuditLog.create({
      action: "payment_verified",
      reason: `Payment confirmed for order ${razorpay_order_id}`,
      orderRef: order?._id,
      amount: order?.amount,
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error("Verification failed:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

router.get("/catalog", async (req, res) => {
  const products = await Product.find();
  res.json({
    merchant: "Panya Store",
    currency: "INR",
    updatedAt: new Date().toISOString(),
    items: products.map((p) => ({
      id: p._id,
      name: p.name,
      price: p.price,
      category: p.category,
      style: p.style,
      color: p.color,
      material: p.material,
      description: p.description,
      inStock: p.stock > 0,
      stock: p.stock,
    })),
  });
});

export default router;