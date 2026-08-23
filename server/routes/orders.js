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

router.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

router.post("/create", async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const amount = product.price * qty;
    const rules = await MerchantRule.findOne();

    if (amount > rules.maxOrderValue) {
      await AuditLog.create({
        action: "order_blocked",
        reason: `Order amount ₹${amount} exceeds max allowed ₹${rules.maxOrderValue}`,
        amount,
      });
      return res.status(403).json({
        blocked: true,
        reason: `This order exceeds the ₹${rules.maxOrderValue} limit, so I can't complete it automatically.`,
      });
    }

    const razorpay = getRazorpayInstance();
    const rzpOrder = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    const order = await Order.create({
      razorpayOrderId: rzpOrder.id,
      items: [{ productId: product._id, name: product.name, price: product.price, qty }],
      amount,
      status: "created",
    });

    await AuditLog.create({
      action: "order_created",
      reason: `Order created for ${product.name} x${qty}`,
      orderRef: order._id,
      amount,
    });

    res.json({
      razorpayOrderId: rzpOrder.id,
      amount: amount * 100,
      keyId: process.env.RAZORPAY_KEY_ID,
      dbOrderId: order._id,
    });
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

export default router;