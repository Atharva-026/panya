export async function sendChatMessage(message, language = "en", history = []) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, language, history }),
  });
  return res.json();
}

export async function transcribeVoice(audioBlob, language = "en") {
  const formData = new FormData();
  formData.append("audio", audioBlob, "voice-input.webm");
  formData.append("language", language);

  const res = await fetch("/api/chat/voice", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Voice transcription failed");
  }

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

export async function fetchMerchantAnalytics() {
  const res = await fetch("/api/merchant/analytics");
  return res.json();
}

export async function fetchMerchantInsights() {
  const res = await fetch("/api/merchant/insights");
  return res.json();
}

export async function refreshMerchantInsights() {
  const res = await fetch("/api/merchant/insights/refresh", { method: "POST" });
  return res.json();
}

export async function fetchUserAnalytics() {
  const guest = sessionStorage.getItem("panya_guest");
  const email = guest ? JSON.parse(guest).email : null;
  const url = email ? `/api/user/analytics?email=${encodeURIComponent(email)}` : "/api/user/analytics";
  const res = await fetch(url, { credentials: "include" });
  return res.json();
}

export async function fetchProducts() {
  const res = await fetch("/api/order/products");
  return res.json();
}

export async function createProduct(product) {
  const res = await fetch("/api/merchant/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Failed to create product");
  return res.json();
}

export async function updateProduct(id, product) {
  const res = await fetch(`/api/merchant/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Failed to update product");
  return res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`/api/merchant/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete product");
  return res.json();
}

export async function sendGuestWelcome(name, email) {
  const res = await fetch("/api/auth/guest-welcome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
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