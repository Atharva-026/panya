import Order from "../models/Order.js";
import AuditLog from "../models/AuditLog.js";

let cached = { token: null, expiresAt: 0 };

// The token response has no expiry field, so refresh every 25 minutes or on a 401
async function getToken(force = false) {
  if (!force && cached.token && Date.now() < cached.expiresAt) return cached.token;

  const res = await fetch(`${process.env.SF_DOMAIN}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    throw new Error(`Salesforce token request failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  cached = { token: data.access_token, expiresAt: Date.now() + 25 * 60 * 1000 };
  return cached.token;
}

async function sfFetch(path, options = {}, retry = true) {
  const token = await getToken();
  const res = await fetch(`${process.env.SF_DOMAIN}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (res.status === 401 && retry) {
    await getToken(true);
    return sfFetch(path, options, false);
  }
  return res;
}

function buildOrderPayload(order) {
  return {
    panyaOrderId: String(order._id),
    name: `PNY-${String(order._id).slice(-6).toUpperCase()}`,
    status: order.status,
    orderDate: new Date(order.createdAt).toISOString(),
    customerName: order.customerName || "",
    customerEmail: order.customerEmail || "",
    razorpayPaymentId: order.razorpayPaymentId || "",
    isUpsell: !!order.isUpsell,
    isAutoOrder: !!order.isAutoOrder,
    items: order.items.map((i) => ({
      panyaProductId: String(i.productId),
      name: i.name,
      quantity: i.qty,
      unitPrice: i.price,
    })),
  };
}

// Sends one order (and its line items) to the Apex REST endpoint
export async function syncOrder(order) {
  const res = await sfFetch("/services/apexrest/panya/orders", {
    method: "POST",
    body: JSON.stringify(buildOrderPayload(order)),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Salesforce returned ${res.status}: ${text.slice(0, 200)}`);
  }
  return data;
}

// Upserts products by their External ID using the standard REST API (no Apex needed)
export async function syncProducts(products) {
  const apiVersion = process.env.SF_API_VERSION || "v67.0";
  const records = products.map((p) => ({
    attributes: { type: "Product__c" },
    Name: String(p.name).slice(0, 80),
    Panya_Product_ID__c: String(p._id),
    Currency__c: p.price,
    Category__c: p.category,
    Stock__c: p.stock,
  }));

  const results = [];
  for (let i = 0; i < records.length; i += 200) {
    const res = await sfFetch(
      `/services/data/${apiVersion}/composite/sobjects/Product__c/Panya_Product_ID__c`,
      { method: "PATCH", body: JSON.stringify({ allOrNone: false, records: records.slice(i, i + 200) }) }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data).slice(0, 300));
    results.push(...data);
  }
  return results;
}

// Fire-and-forget wrappers: Salesforce trouble must never block checkout
export function syncOrderSafely(orderId) {
  if (process.env.SF_SYNC_ENABLED !== "true") return;
  (async () => {
    try {
      const order = await Order.findById(orderId);
      if (!order || !order.items.length) return;
      await syncOrder(order);
    } catch (err) {
      console.error("Salesforce order sync failed:", err.message);
      try {
        await AuditLog.create({
          action: "salesforce_sync_failed",
          reason: err.message.slice(0, 300),
          orderRef: orderId,
        });
      } catch {}
    }
  })();
}

export function syncProductSafely(product) {
  if (process.env.SF_SYNC_ENABLED !== "true") return;
  syncProducts([product])
    .then((results) => {
      const failed = results.filter((r) => !r.success);
      if (failed.length) {
        const message = failed[0].errors?.[0]?.message || "unknown error";
        console.error("Salesforce product sync rejected:", message);
        return AuditLog.create({
          action: "salesforce_sync_failed",
          reason: `Product ${product.name}: ${message}`.slice(0, 300),
        });
      }
    })
    .catch((err) => console.error("Salesforce product sync failed:", err.message));
}