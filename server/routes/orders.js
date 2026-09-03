import crypto from "crypto";
import express from "express";
import Razorpay from "razorpay";
import { trace } from "@opentelemetry/api";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";
import MerchantRule from "../models/MerchantRule.js";
import { sendOrderConfirmationEmail } from "../utils/email.js";

const router = express.Router();
const tracer = trace.getTracer('panya-backend');

function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function getOrCreateRazorpayCustomer(user) {
  const razorpay = getRazorpayInstance();

  if (user.razorpayCustomerId) {
    return user.razorpayCustomerId;
  }

  const customer = await razorpay.customers.create({
    name: user.name,
    email: user.email,
    contact: "9999999999",
    fail_existing: 0,
  });

  user.razorpayCustomerId = customer.id;
  await user.save();

  return customer.id;
}

async function getTodaySpend(userId, customerEmail) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const query = {
    status: "paid",
    createdAt: { $gte: startOfDay },
  };

  if (userId) {
    query.userId = userId;
  } else if (customerEmail) {
    query.customerEmail = customerEmail;
  } else {
    return 0;
  }

  const orders = await Order.find(query);
  return orders.reduce((sum, order) => sum + order.amount, 0);
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

  const todaySpend = await getTodaySpend(userId, customer.email);
  if (todaySpend + amount > rules.dailySpendCap) {
    const remaining = Math.max(0, rules.dailySpendCap - todaySpend);
    await AuditLog.create({
      action: "order_blocked",
      reason: `Order would bring today's spend to ₹${todaySpend + amount}, exceeding the daily cap of ₹${rules.dailySpendCap}`,
      amount,
    });
    return {
      blocked: true,
      reason: `You've already spent ₹${todaySpend} today. This order would exceed your daily limit of ₹${rules.dailySpendCap} — you have ₹${remaining} remaining today.`,
    };
  }

  const razorpay = getRazorpayInstance();
  const { trace } = await import('@opentelemetry/api');
  const tracer = trace.getTracer('panya-backend');
  
  const rzpOrder = await tracer.startActiveSpan('razorpay.create_order', async (span) => {
    try {
      const result = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
      });
      span.setAttribute('razorpay.currency', 'INR');
      span.setAttribute('razorpay.amount_paise', amount * 100);
      return result;
    } finally {
      span.end();
    }
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

export async function createPaymentLinkForItems(items, customer = {}, userId = null) {
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
      reason: `Auto-order amount ₹${amount} exceeds max allowed ₹${rules.maxOrderValue}`,
      amount,
    });
    return {
      blocked: true,
      reason: `This order exceeds the ₹${rules.maxOrderValue} limit, so I can't complete it automatically.`,
    };
  }

  const razorpay = getRazorpayInstance();
  const { trace } = await import('@opentelemetry/api');
  const paymentTracer = trace.getTracer('panya-backend');

  let paymentLink;
  paymentLink = await paymentTracer.startActiveSpan('razorpay.create_payment_link', async (span) => {
    try {
      const result = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: "INR",
        accept_partial: false,
        description: `Panya auto-order: ${orderItems.map((i) => i.name).join(", ")}`,
        customer: {
          name: customer.name || "Customer",
          email: customer.email || "",
          contact: "9876543210",
        },
        notify: { sms: false, email: false },
        notes: { source: "auto-order-agent" },
      });
      span.setAttribute('razorpay.currency', 'INR');
      span.setAttribute('razorpay.amount_paise', amount * 100);
      return result;
    } catch (err) {
      span.recordException(err);
      console.error("Payment link creation failed:", JSON.stringify(err.error || err, null, 2));
      throw err;
    } finally {
      span.end();
    }
  });

  const order = await Order.create({
    razorpayOrderId: paymentLink.id,
    items: orderItems,
    amount,
    status: "created",
    isUpsell: items.length > 1,
    customerName: customer.name || "",
    customerEmail: customer.email || "",
    isAutoOrder: true,
    userId,
  });

  await AuditLog.create({
    action: "auto_order_link_created",
    reason: `Agent autonomously selected and created a payment link for ${orderItems.map((i) => i.name).join(", ")}`,
    orderRef: order._id,
    amount,
  });

  return {
    paymentLinkId: paymentLink.id,
    paymentLinkUrl: paymentLink.short_url,
    amount,
    dbOrderId: order._id,
  };
}

router.get("/test-customer", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Sign in required" });
  const customerId = await getOrCreateRazorpayCustomer(req.user);
  res.json({ razorpayCustomerId: customerId });
});

router.post("/webhook", express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = req.body;

    if (event.event === "payment_link.paid") {
      const paymentLinkId = event.payload.payment_link.entity.id;
      const paymentId = event.payload.payment.entity.id;

      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: paymentLinkId, status: { $ne: "paid" } },
        { status: "paid", razorpayPaymentId: paymentId },
        { returnDocument: "after" }
      );

      if (order) {
        await AuditLog.create({
          action: "payment_verified",
          reason: `Payment confirmed via webhook for auto-order ${paymentLinkId}`,
          orderRef: order._id,
          amount: order.amount,
        });

        if (order.customerEmail) {
          sendOrderConfirmationEmail(order.customerEmail, order).catch((err) =>
            console.error("Order confirmation email failed:", err)
          );
        }
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook processing failed:", err.message);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

router.get("/payment-link-status/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status === "paid") {
      return res.json({ status: "paid", order });
    }

    const razorpay = getRazorpayInstance();
    const link = await razorpay.paymentLink.fetch(order.razorpayOrderId);

    if (link.status === "paid") {
      order.status = "paid";
      order.razorpayPaymentId = link.payments?.[0]?.payment_id || "";
      await order.save();

      await AuditLog.create({
        action: "payment_verified",
        reason: `Payment confirmed via status check for auto-order ${order.razorpayOrderId}`,
        orderRef: order._id,
        amount: order.amount,
      });

      if (order.customerEmail) {
        await sendOrderConfirmationEmail(order.customerEmail, order);
      }
    }

    res.json({ status: link.status, order });
  } catch (err) {
    console.error("Payment link status check failed:", err.message);
    res.status(500).json({ error: "Status check failed" });
  }
});

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

    if (order?.customerEmail) {
      sendOrderConfirmationEmail(order.customerEmail, order).catch((err) =>
        console.error("Order confirmation email failed:", err)
      );
    }

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