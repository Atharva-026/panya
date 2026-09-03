import crypto from "crypto";
import express from "express";
import Razorpay from "razorpay";
import { trace } from "@opentelemetry/api";
import AutoOrderRule from "../models/AutoOrderRule.js";
import User from "../models/User.js";
import { getOrCreateRazorpayCustomer } from "./orders.js";
import { runAutonomousPurchase } from "../utils/aiBuyer.js";

const router = express.Router();
const tracer = trace.getTracer('panya-backend');

function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Sign in required" });
  next();
}

function calculateNextRun(frequency) {
  const next = new Date();
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

router.get("/rules", requireAuth, async (req, res) => {
  const rules = await AutoOrderRule.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(rules);
});

router.post("/rules", requireAuth, async (req, res) => {
  const { goal, budget, frequency } = req.body || {};
  if (!goal || !budget || !frequency) {
    return res.status(400).json({ error: "goal, budget, and frequency are required" });
  }

  const rule = await AutoOrderRule.create({
    userId: req.user._id,
    goal,
    budget,
    frequency,
    nextRunDate: calculateNextRun(frequency),
  });

  res.json(rule);
});

router.patch("/rules/:id/toggle", requireAuth, async (req, res) => {
  const rule = await AutoOrderRule.findOne({ _id: req.params.id, userId: req.user._id });
  if (!rule) return res.status(404).json({ error: "Rule not found" });

  rule.active = !rule.active;
  await rule.save();
  res.json(rule);
});

router.post("/rules/:id/authorize", requireAuth, async (req, res) => {
  try {
    const rule = await AutoOrderRule.findOne({ _id: req.params.id, userId: req.user._id });
    if (!rule) return res.status(404).json({ error: "Rule not found" });

    const customerId = await getOrCreateRazorpayCustomer(req.user);
    const razorpay = getRazorpayInstance();

    const amount = rule.budget * 100;

    const order = await tracer.startActiveSpan('razorpay.create_order', async (span) => {
      try {
        const result = await razorpay.orders.create({
          amount,
          currency: "INR",
          customer_id: customerId,
          method: "card",
          token: {
            max_amount: rule.budget * 100,
            expire_at: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
          },
          notes: { ruleId: rule._id.toString() },
        });
        span.setAttribute('razorpay.currency', 'INR');
        span.setAttribute('razorpay.amount_paise', amount);
        return result;
      } finally {
        span.end();
      }
    });

    res.json({
      orderId: order.id,
      amount,
      keyId: process.env.RAZORPAY_KEY_ID,
      customerId,
    });
  } catch (err) {
    console.error("Authorization order creation failed:", JSON.stringify(err.error || err, null, 2));
    res.status(500).json({ error: "Failed to create authorization order", details: err.error || err.message });
  }
});

router.post("/rules/:id/authorize-verify", requireAuth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing verification fields" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Signature verification failed" });
    }

    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (!payment.token_id) {
      return res.status(400).json({ error: "No recurring token was generated for this payment" });
    }

    const user = await User.findById(req.user._id);
    user.savedPaymentToken = payment.token_id;
    await user.save();

    const rule = await AutoOrderRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    rule.authorized = true;
    await rule.save();

    res.json({ success: true, tokenId: payment.token_id });
  } catch (err) {
    console.error("Authorization verification failed:", err.error || err);
    res.status(500).json({ error: "Verification failed" });
  }
});

router.delete("/rules/:id", requireAuth, async (req, res) => {
  await AutoOrderRule.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true });
});

// "Run now" — manually trigger a rule immediately, for testing/demo purposes
router.post("/rules/:id/run-now", requireAuth, async (req, res) => {
  try {
    const rule = await AutoOrderRule.findOne({ _id: req.params.id, userId: req.user._id });
    if (!rule) return res.status(404).json({ error: "Rule not found" });

    const result = await runAutonomousPurchase(rule.goal, rule.budget, rule.userId, {
      name: req.user.name,
      email: req.user.email,
    });

    if (result.success) {
      rule.nextRunDate = calculateNextRun(rule.frequency);
      await rule.save();
    }

    res.json(result);
  } catch (err) {
    console.error("Run-now failed:", JSON.stringify(err.error || err.message || err, null, 2));
    res.status(500).json({ error: "Failed to run auto-order", details: err.error || err.message });
  }
});

export default router;