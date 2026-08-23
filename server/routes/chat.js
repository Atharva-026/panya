import express from "express";
import Groq from "groq-sdk";
import Product from "../models/Product.js";
import { getUpsellSuggestion } from "../utils/upsell.js";
import { createOrderForItems } from "./orders.js";

const router = express.Router();

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

router.post("/", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Fetch current catalog to give the LLM real context
    const products = await Product.find();
    const catalogText = products
      .map((p) => `- ${p.name} (₹${p.price}, category: ${p.category}, id: ${p._id})`)
      .join("\n");

    const groq = getGroqClient();

    const systemPrompt = `You are a shopping assistant for a store. Here is the current catalog:
${catalogText}

The customer will describe what they want in plain language. Your job:
1. Identify which product (if any) matches their request from the catalog above.
2. Reply ONLY in strict JSON, no extra text, no markdown, in this exact shape:
{
  "reply": "a short, friendly natural-language response to the customer",
  "matchedProductId": "the _id of the matched product, or null if no match",
  "qty": 1
}
If nothing in the catalog matches, set matchedProductId to null and explain that in the reply.`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("LLM returned non-JSON:", raw);
      return res.status(502).json({ error: "Agent response could not be parsed" });
    }

    let matchedProduct = null;
    let upsell = null;

    if (parsed.matchedProductId) {
      matchedProduct = await Product.findById(parsed.matchedProductId);
      if (matchedProduct) {
        upsell = await getUpsellSuggestion(matchedProduct, Product);
      }
    }

    res.json({
      reply: parsed.reply,
      matchedProductId: parsed.matchedProductId,
      qty: parsed.qty,
      upsell: upsell
        ? { id: upsell._id, name: upsell.name, price: upsell.price }
        : null,
    });
  } catch (err) {
    console.error("Chat failed:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

router.post("/confirm", async (req, res) => {
  try {
    const { productId, qty = 1, includeUpsell = false, upsellProductId } = req.body || {};
    if (!productId) return res.status(400).json({ error: "productId is required" });

    const items = [{ productId, qty }];
    if (includeUpsell && upsellProductId) {
      items.push({ productId: upsellProductId, qty: 1 });
    }

    const result = await createOrderForItems(items);
    if (result.blocked) return res.status(403).json(result);
    res.json(result);
  } catch (err) {
    console.error("Confirm failed:", err);
    res.status(500).json({ error: "Failed to confirm order" });
  }
});

export default router;