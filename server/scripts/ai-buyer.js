import dotenv from "dotenv";
import Groq from "groq-sdk";
dotenv.config();

const BASE_URL = "http://localhost:3001/api";
const BUYER_GOAL = process.argv[2] || "I need something for a formal wedding, budget conscious";

async function run() {
  console.log(`AI Buyer Agent starting. Goal: "${BUYER_GOAL}"\n`);

  // Step 1: fetch the agent-readable catalog
  const catalogRes = await fetch(`${BASE_URL}/order/catalog`);
  const catalog = await catalogRes.json();
  console.log(`Fetched catalog from ${catalog.merchant} — ${catalog.items.length} items available.\n`);

  // Step 2: reason over the catalog using its own LLM call
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const itemsText = catalog.items
    .filter((i) => i.inStock)
    .map((i) => `- ${i.name} (id: ${i.id}, ₹${i.price}, ${i.category}, ${i.style}, ${i.description})`)
    .join("\n");

  const prompt = `You are an autonomous shopping agent making a purchase decision on behalf of a buyer.

Buyer's goal: "${BUYER_GOAL}"

Available items:
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
  console.log(`Agent decision: ${decision.reasoning}\n`);

  // Step 3: place the order autonomously
  const orderRes = await fetch(`${BASE_URL}/chat/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ productId: decision.productId, qty: 1 }] }),
  });
  const orderResult = await orderRes.json();

  if (orderResult.blocked) {
    console.log(`Order blocked: ${orderResult.reason}`);
    return;
  }

  console.log(`Order created: ${orderResult.razorpayOrderId}, amount: ₹${orderResult.amount / 100}`);
  console.log(`\nNote: this script creates a real Razorpay test order via API.`);
  console.log(`Since this is a server-to-server script (no browser), payment capture`);
  console.log(`would need Razorpay's S2S payment API or a headless checkout — `);
  console.log(`for the demo, this proves the AGENT DECISION + ORDER CREATION is fully autonomous.`);
}

run().catch((err) => console.error("AI Buyer failed:", err));