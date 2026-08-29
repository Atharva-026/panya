import Groq from "groq-sdk";
import Product from "../models/Product.js";
import { createPaymentLinkForItems } from "../routes/orders.js";

export async function runAutonomousPurchase(goal, budget, userId, customer = {}) {
  const products = await Product.find({ stock: { $gt: 0 } });

  const itemsText = products
    .filter((p) => p.price <= budget)
    .map((p) => `- ${p.name} (id: ${p._id}, ₹${p.price}, ${p.category}, ${p.style}, ${p.description})`)
    .join("\n");

  if (!itemsText) {
    return { success: false, reason: `Nothing in stock fits within ₹${budget}.` };
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are an autonomous shopping agent making a purchase decision on behalf of a buyer.

Buyer's goal: "${goal}"
Budget: up to ₹${budget}

Available items within budget:
${itemsText}

Pick exactly ONE item that best satisfies the buyer's goal. Reply ONLY in strict JSON:
{
  "productId": "the chosen item's id",
  "reasoning": "one sentence on why this fits the goal"
}`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const decision = JSON.parse(completion.choices[0].message.content);

  const linkResult = await createPaymentLinkForItems(
    [{ productId: decision.productId, qty: 1 }],
    customer,
    userId
  );

  if (linkResult.blocked) {
    return { success: false, reason: linkResult.reason };
  }

  return { success: true, decision, paymentLink: linkResult };
}