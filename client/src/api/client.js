export async function sendChatMessage(message) {
  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function confirmOrder(items) {
  const res = await fetch("/chat/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  return res.json();
}

export async function verifyPayment(paymentResponse) {
  const res = await fetch("/order/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentResponse),
  });
  return res.json();
}

export async function fetchMerchantDashboard() {
  const res = await fetch("/merchant/dashboard");
  return res.json();
}

export async function fetchMerchantRules() {
  const res = await fetch("/merchant/rules");
  return res.json();
}