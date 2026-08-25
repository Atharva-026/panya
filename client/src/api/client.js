export async function sendChatMessage(message) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function confirmOrder(items, customer = {}) {
  const res = await fetch("/api/chat/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      customerName: customer.name,
      customerEmail: customer.email,
    }),
  });
  return res.json();
}

export async function verifyPayment(paymentResponse) {
  const res = await fetch("/api/order/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentResponse),
  });
  return res.json();
}

export async function fetchMerchantDashboard() {
  const res = await fetch("/api/merchant/dashboard");
  return res.json();
}

export async function fetchMerchantRules() {
  const res = await fetch("/api/merchant/rules");
  return res.json();
}

export async function checkAuth() {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  return res.json();
}

export async function logout() {
  const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  return res.json();
}