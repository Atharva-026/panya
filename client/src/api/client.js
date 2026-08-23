export async function sendChatMessage(message) {
  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function confirmOrder({ productId, qty, includeUpsell, upsellProductId }) {
  const res = await fetch("/chat/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, qty, includeUpsell, upsellProductId }),
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