import express from "express";
import multer from "multer";
import Groq from "groq-sdk";
import { toFile } from "groq-sdk";
import { trace } from "@opentelemetry/api";
import Product from "../models/Product.js";
import ChatQueryLog from "../models/ChatQueryLog.js";
import { createOrderForItems } from "./orders.js";

const router = express.Router();
const tracer = trace.getTracer('panya-backend');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  kn: "Kannada",
};

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

  const completion = await tracer.startActiveSpan('groq.upsell_reasoning', async (span) => {
    try {
      const result = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      });
      span.setAttribute('groq.model', 'openai/gpt-oss-120b');
      span.setAttribute('groq.temperature', 0.4);
      return result;
    } finally {
      span.end();
    }
  });

  try {
    return JSON.parse(completion.choices[0].message.content);
  } catch {
    return { upsellProductId: null, reason: "" };
  }
}

router.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const { language = "en" } = req.body || {};
    const groq = getGroqClient();

    const transcription = await groq.audio.transcriptions.create({
      file: await toFile(req.file.buffer, "voice-input.webm"),
      model: "whisper-large-v3-turbo",
      language,
    });

    const text = (transcription.text || "").trim();
    if (!text) {
      return res.status(422).json({ error: "Didn't catch that — try again or type it" });
    }

    res.json({ text });
  } catch (err) {
    console.error("Voice transcription failed:", err);
    res.status(502).json({ error: "Voice transcription failed — try again or type it" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { message, language = "en", history = [] } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const products = await Product.find();
    const catalogText = products
      .map((p) => `- ${p.name} (₹${p.price}, category: ${p.category}, id: ${p._id})`)
      .join("\n");

    const groq = getGroqClient();
    const languageName = LANGUAGE_NAMES[language] || "English";

    const systemPrompt = `You are a shopping assistant for a store. Here is the current catalog:
${catalogText}

The customer will describe what they want in plain language, in any language. Your job:
1. Try to find an exact or close match in the catalog above.
2. If nothing matches exactly, think about what they're actually looking for (occasion, style, category, use-case) and suggest the CLOSEST reasonable alternative from the catalog — the way a good salesperson would redirect a customer, not just say "we don't have that."
3. Only say nothing is available if genuinely nothing in the catalog is even a reasonable substitute.
4. Use the prior conversation turns below for context — if the customer refers back to something mentioned earlier (e.g. "you suggest", "the second one", "that one"), resolve it against that history instead of asking them to repeat themselves.

CRITICAL LANGUAGE RULE: The "reply" field must be written ENTIRELY in ${languageName}, using ${languageName} script — regardless of what language the customer typed in. This is non-negotiable. The only exception is product names, which stay in English (e.g. "Red Running Shoe") even inside an otherwise ${languageName} sentence.

Reply ONLY in strict JSON, no extra text, no markdown, in this exact shape:
{
  "reply": "a short, friendly natural-language response to the customer, written entirely in ${languageName} — if suggesting an alternative, briefly explain why it's a good substitute",
  "matchedProductId": "the _id of the matched or suggested product, or null if truly nothing fits",
  "qty": 1
}`;

    // Only keep the last few turns — controls token usage/cost and keeps
    // the model focused on recent context rather than the whole session.
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];

    const completion = await tracer.startActiveSpan('groq.intent_parsing', async (span) => {
      try {
        const result = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            ...recentHistory,
            { role: "user", content: `${message}\n\n(Reply in ${languageName}.)` },
          ],
          temperature: 0.3,
        });
        span.setAttribute('groq.model', 'openai/gpt-oss-120b');
        span.setAttribute('groq.temperature', 0.3);
        span.setAttribute('groq.language', language);
        span.setAttribute('groq.history_length', recentHistory.length);
        return result;
      } finally {
        span.end();
      }
    });

    const raw = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("LLM returned non-JSON:", raw);
      return res.status(502).json({ error: "Agent response could not be parsed" });
    }

    ChatQueryLog.create({
      message,
      matched: !!parsed.matchedProductId,
      matchedProductId: parsed.matchedProductId || null,
    }).catch((err) => console.error("Chat query log failed:", err));

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