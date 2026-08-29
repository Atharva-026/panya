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

export async function fetchAutoOrderRules() {
  const res = await fetch("/api/auto-order/rules", { credentials: "include" });
  return res.json();
}

export async function createAutoOrderRule(goal, budget, frequency) {
  const res = await fetch("/api/auto-order/rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ goal, budget, frequency }),
  });
  return res.json();
}

export async function toggleAutoOrderRule(id) {
  const res = await fetch(`/api/auto-order/rules/${id}/toggle`, {
    method: "PATCH",
    credentials: "include",
  });
  return res.json();
}

export async function deleteAutoOrderRule(id) {
  const res = await fetch(`/api/auto-order/rules/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return res.json();
}

export async function runAutoOrderNow(id) {
  const res = await fetch(`/api/auto-order/rules/${id}/run-now`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}