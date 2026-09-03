import Groq from "groq-sdk";
import { trace } from "@opentelemetry/api";
import MerchantInsight from "../models/MerchantInsight.js";

const tracer = trace.getTracer('panya-backend');
import {
  getTopProducts,
  getRevenueByCategory,
  getRestockUrgency,
  getUpsellStats,
  getUnmatchedQueries,
  getOrderSpike,
} from "./analytics.js";

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function generateMerchantInsight() {
  const [topProducts, revenueByCategory, restockUrgency, upsellStats, unmatchedQueries, spike] =
    await Promise.all([
      getTopProducts(30, 5),
      getRevenueByCategory(30),
      getRestockUrgency(14),
      getUpsellStats(),
      getUnmatchedQueries(7, 50),
      getOrderSpike(),
    ]);

  const summary = {
    topProducts,
    revenueByCategory,
    restockUrgency,
    upsellStats,
    unmatchedQueryCount: unmatchedQueries.length,
    unmatchedQueriesSample: unmatchedQueries.slice(0, 20),
  };

  let narrative = [];
  try {
    const groq = getGroqClient();
    const prompt = `You are a retail analyst. Here is this merchant's last 30 days of data, already computed — do not do any math yourself, only interpret it:

${JSON.stringify(summary, null, 2)}

Write 3 to 5 short, concrete bullet points for the merchant covering:
- what's trending / selling well
- what to restock first, if anything is genuinely low relative to its sales pace
- if there are recurring themes in "unmatchedQueriesSample" (things customers asked for but the store doesn't carry), call out the pattern and suggest what to consider adding — only if a real pattern exists, don't force one
- one realistic bundling or promotion idea based on what's actually selling together, if evidence supports it

Be specific and reference actual product/category names from the data. Do not invent numbers. If a category has too little data to say anything meaningful, say so briefly rather than guessing.
All monetary amounts in the data are in Indian Rupees — always use the ₹ symbol when referring to them, never $.

Reply ONLY as a strict JSON array of strings, no extra text:
["bullet one", "bullet two"]`;

    const completion = await tracer.startActiveSpan('groq.merchant_insight', async (span) => {
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

    narrative = JSON.parse(completion.choices[0].message.content);
    if (!Array.isArray(narrative)) narrative = [];
  } catch (err) {
    console.error("Insight generation failed:", err);
    narrative = ["Insight generation is temporarily unavailable — the numbers above are still live and accurate."];
  }

  const spikeAlert = {
    triggered: spike.triggered,
    message: spike.triggered
      ? `Order volume in the last hour (${spike.lastHourCount}) is well above the recent average (${spike.avgPerHour}/hr).`
      : "",
  };

  const insight = await MerchantInsight.create({ narrative, spikeAlert });
  return insight;
}