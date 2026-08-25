import express from "express";
import Groq from "groq-sdk";
import Product from "../models/Product.js";
import { createOrderForItems } from "./orders.js";

const router = express.Router();

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function getReasonedUpsell(matchedProduct, allProducts, groq) {
  const candidates = allProducts.filter(
    (p) => p._id.toString() !== matchedProduct._id.toString()
  );

  const candidateText = candidates
    .map(
      (p) =>
        `- ${p.name} (id: ${p._id}, ₹${p.price}, category: ${p.category}, style: ${p.style}, ${p.description})`
    )
    .join("\n");

  const prompt = `A customer just bought: ${matchedProduct.name} (${matchedProduct.description}).

Here are other items currently in stock:
${candidateText}

Suggest ONE genuinely complementary item from the list above that pairs naturally with what they bought — something a real salesperson would suggest, not just same-category. If nothing fits well, say so.

Reply ONLY in strict JSON, no extra text:
{
  "upsellProductId": "the _id of your suggestion, or null if nothing fits",
  "reason": "one short sentence explaining why this pairs well"
}`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });

  try {
    return JSON.parse(completion.choices[0].message.content);
  } catch {
    return { upsellProductId: null, reason: "" };
  }
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
1. Try to find an exact or close match in the catalog above.
2. If nothing matches exactly, think about what they're actually looking for (occasion, style, category, use-case) and suggest the CLOSEST reasonable alternative from the catalog — the way a good salesperson would redirect a customer, not just say "we don't have that."
3. Only say nothing is available if genuinely nothing in the catalog is even a reasonable substitute.

Reply ONLY in strict JSON, no extra text, no markdown, in this exact shape:
{
  "reply": "a short, friendly natural-language response to the customer — if suggesting an alternative, briefly explain why it's a good substitute",
  "matchedProductId": "the _id of the matched or suggested product, or null if truly nothing fits",
  "qty": 1
}`;

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
    let upsellReason = "";

    if (parsed.matchedProductId) {
      matchedProduct = await Product.findById(parsed.matchedProductId);
      if (matchedProduct) {
        const allProducts = await Product.find();
        const upsellResult = await getReasonedUpsell(matchedProduct, allProducts, groq);

        if (upsellResult.upsellProductId) {
          const upsellProduct = await Product.findById(upsellResult.upsellProductId);
          if (upsellProduct) {
            upsell = {
              id: upsellProduct._id,
              name: upsellProduct.name,
              price: upsellProduct.price,
              imageUrl: upsellProduct.imageUrl,
            };
            upsellReason = upsellResult.reason;
          }
        }
      }
    }

    res.json({
      reply: parsed.reply,
      matchedProductId: parsed.matchedProductId,
      matchedName: matchedProduct ? matchedProduct.name : null,
      matchedPrice: matchedProduct ? matchedProduct.price : null,
      matchedImageUrl: matchedProduct ? matchedProduct.imageUrl : null,
      qty: parsed.qty,
      upsell,
      upsellReason,
    });
  } catch (err) {
    console.error("Chat failed:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

router.post("/confirm", async (req, res) => {
  try {
    const { items, customerName = "", customerEmail = "" } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }

    const userId = req.user ? req.user._id : null;
    const result = await createOrderForItems(items, {
      name: customerName,
      email: customerEmail,
    }, userId);
    if (result.blocked) return res.status(403).json(result);
    res.json(result);
  } catch (err) {
    console.error("Confirm failed:", err);
    res.status(500).json({ error: "Failed to confirm order" });
  }
});

export default router;