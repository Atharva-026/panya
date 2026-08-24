import { useState, useRef, useEffect } from "react";
import { sendChatMessage, confirmOrder, verifyPayment } from "../api/client";
import "./Chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingMatch, setPendingMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMatch]);

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

  async function handleConfirm(includeUpsell) {
    if (!pendingMatch) return;
    setLoading(true);

    const result = await confirmOrder({
      productId: pendingMatch.matchedProductId,
      qty: pendingMatch.qty,
      includeUpsell,
      upsellProductId: pendingMatch.upsell ? pendingMatch.upsell.id : null,
    });

    if (result.blocked) {
      setMessages((prev) => [...prev, { role: "assistant", text: result.reason }]);
      setPendingMatch(null);
      setLoading(false);
      return;
    }

    setPendingMatch(null);

    const options = {
      key: result.keyId,
      amount: result.amount,
      currency: "INR",
      order_id: result.razorpayOrderId,
      name: "Panya",
      handler: async (response) => {
        const verifyResult = await verifyPayment(response);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: verifyResult.success
              ? "Payment successful. Your order is confirmed."
              : "Payment could not be verified.",
          },
        ]);
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSend();
  }

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
            {pendingMatch.upsell ? (
              <>
                <p>Add {pendingMatch.upsell.name} for ₹{pendingMatch.upsell.price}?</p>
                {pendingMatch.upsellReason && (
                  <p className="upsell-reason">{pendingMatch.upsellReason}</p>
                )}
                <div className="upsell-actions">
                  <button onClick={() => handleConfirm(true)}>Add and checkout</button>
                  <button onClick={() => handleConfirm(false)} className="secondary">
                    Just checkout
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => handleConfirm(false)}>Proceed to checkout</button>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

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