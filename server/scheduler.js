import express from "express";
import AutoOrderRule from "../models/AutoOrderRule.js";
import { runAutonomousPurchase } from "../utils/aiBuyer.js";

const router = express.Router();

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

router.delete("/rules/:id", requireAuth, async (req, res) => {
  await AutoOrderRule.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true });
});

// "Run now" — manually trigger a rule immediately, for testing/demo purposes
router.post("/rules/:id/run-now", requireAuth, async (req, res) => {
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
});

export default router;