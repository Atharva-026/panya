import { useState, useRef, useEffect } from "react";
import { sendChatMessage, confirmOrder, verifyPayment, fetchMerchantRules } from "../api/client";
import "./Chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingMatch, setPendingMatch] = useState(null);
  const [cart, setCart] = useState([]);
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "" });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchMerchantRules().then(setRules);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMatch, cart]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    const data = await sendChatMessage(text);
    setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    setPendingMatch(data.matchedProductId ? data : null);
    setLoading(false);
  }

  function addToCart(productId, name, price, qty) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { productId, name, price, qty }];
    });
    setPendingMatch(null);
  }

  function handleAddMain() {
    if (!pendingMatch) return;
    addToCart(pendingMatch.matchedProductId, extractMainName(pendingMatch.reply), null, pendingMatch.qty);
  }

  // We don't have the main product's price/name directly from /chat response,
  // so we add both main + upsell together when confirmed via checkout instead.
  // Simplify: "Add to cart" adds main item using data we already have from pendingMatch.

  function handleAddPending(includeUpsell) {
    if (!pendingMatch) return;
    addToCart(
      pendingMatch.matchedProductId,
      pendingMatch.matchedName,
      pendingMatch.matchedPrice,
      pendingMatch.qty
    );
    if (includeUpsell && pendingMatch.upsell) {
      addToCart(
        pendingMatch.upsell.id,
        pendingMatch.upsell.name,
        pendingMatch.upsell.price,
        1
      );
    }
    setPendingMatch(null);
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function handleCheckout() {
    if (cart.length === 0) return;

    if (!customer.name || !customer.email) {
      setShowCustomerForm(true);
      return;
    }

    await placeOrder();
  }

  async function placeOrder() {
    setLoading(true);

    const items = cart.map((i) => ({ productId: i.productId, qty: i.qty }));
    const result = await confirmOrder(items, customer);

    if (result.blocked) {
      setMessages((prev) => [...prev, { role: "assistant", text: result.reason }]);
      setLoading(false);
      return;
    }

    const options = {
      key: result.keyId,
      amount: result.amount,
      currency: "INR",
      order_id: result.razorpayOrderId,
      name: "Panya",
      prefill: { name: customer.name, email: customer.email },
      handler: async (response) => {
        const verifyResult = await verifyPayment(response);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: verifyResult.success
              ? `Payment successful. A receipt has been sent to ${customer.email}.`
              : "Payment could not be verified.",
          },
        ]);
        setCart([]);
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setLoading(false);
  }

  function handleCustomerSubmit(e) {
    e.preventDefault();
    if (!customer.name || !customer.email) return;
    setShowCustomerForm(false);
    placeOrder();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSend();
  }

  const withinLimit = rules && cartTotal <= rules.maxOrderValue;

  return (
    <div className="chat-page">
      <div className="chat-header">Panya</div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.text}
          </div>
        ))}

        {pendingMatch && (
          <div className="upsell-card">
            <div className="product-preview">
              {pendingMatch.matchedImageUrl && (
                <img src={pendingMatch.matchedImageUrl} alt={pendingMatch.matchedName} className="product-thumb" />
              )}
              <div>
                <p>{pendingMatch.reply}</p>
              </div>
            </div>
            {pendingMatch.upsell && (
              <div className="product-preview upsell-preview">
                {pendingMatch.upsell.imageUrl && (
                  <img src={pendingMatch.upsell.imageUrl} alt={pendingMatch.upsell.name} className="product-thumb small" />
                )}
                <p className="upsell-reason">
                  Suggested: {pendingMatch.upsell.name} (₹{pendingMatch.upsell.price}) — {pendingMatch.upsellReason}
                </p>
              </div>
            )}
            <div className="upsell-actions">
              <button onClick={() => handleAddPending(false)}>Add item</button>
              {pendingMatch.upsell && (
                <button onClick={() => handleAddPending(true)}>Add item + suggestion</button>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {cart.length > 0 && (
        <div className="cart-card">
          <div className="cart-title">Your order</div>
          {cart.map((item) => (
            <div key={item.productId} className="cart-row">
              <span>{item.name} × {item.qty}</span>
              <span>₹{item.price * item.qty}</span>
              <button className="cart-remove" onClick={() => removeFromCart(item.productId)}>Remove</button>
            </div>
          ))}
          <div className="cart-total-row">
            <span>Total</span>
            <span>₹{cartTotal}</span>
          </div>
          {rules && (
            <div className={`rule-tag ${withinLimit ? "ok" : "blocked"}`}>
              {withinLimit
                ? `Within max order limit (₹${rules.maxOrderValue})`
                : `Exceeds max order limit (₹${rules.maxOrderValue}) — will be blocked`}
            </div>
          )}
          <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
            Checkout
          </button>
        </div>
      )}

      {showCustomerForm && (
        <div className="customer-form-card">
          <p>Where should we send your receipt?</p>
          <form onSubmit={handleCustomerSubmit}>
            <input
              placeholder="Your name"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Your email"
              value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            />
            <button type="submit">Continue to payment</button>
          </form>
        </div>
      )}

      <div className="chat-input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you're looking for..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;