import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { sendChatMessage, transcribeVoice, confirmOrder, verifyPayment, fetchMerchantRules, checkAuth } from "../api/client";
import { LANGUAGES, translations } from "../i18n";
import "./Chat.css";

const VOICE_SUPPORTED =
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices &&
  typeof window !== "undefined" &&
  !!window.MediaRecorder;

function extractMainName(reply) {
  return reply;
}

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingMatch, setPendingMatch] = useState(null);
  const [cart, setCart] = useState([]);
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "" });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceOriginated, setVoiceOriginated] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("panya_lang") || "en");
  const bottomRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const location = useLocation();

  const t = translations[language] || translations.en;

  useEffect(() => {
    localStorage.setItem("panya_lang", language);
  }, [language]);

  useEffect(() => {
    fetchMerchantRules().then(setRules);
  }, []);

  useEffect(() => {
    const guest = sessionStorage.getItem("panya_guest");
    if (guest) {
      setCustomer(JSON.parse(guest));
    } else {
      checkAuth().then((data) => {
        if (data.authenticated) {
          setCustomer({ name: data.user.name, email: data.user.email });
        }
      });
    }
  }, []);

  useEffect(() => {
    if (customer.name && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: `Hi ${customer.name.split(" ")[0]}, what are you looking for today?`,
        },
      ]);
    }
  }, [customer.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMatch, cart]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function speak(text) {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGES.find((l) => l.code === language)?.speechLang || "en-IN";
    window.speechSynthesis.speak(utterance);
  }

  async function handleSend(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    const data = await sendChatMessage(text, language);
    setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    setPendingMatch(data.matchedProductId ? data : null);
    setLoading(false);
    if (voiceOriginated) speak(data.reply);
    setVoiceOriginated(false);
  }

  useEffect(() => {
    if (location.state?.initialPrompt) {
      handleSend(location.state.initialPrompt);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        if (audioBlob.size === 0) return;

        setTranscribing(true);
        try {
          const { text } = await transcribeVoice(audioBlob, language);
          if (text) {
            setInput(text);
            setVoiceOriginated(true);
          }
        } catch (err) {
          setMessages((prev) => [...prev, { role: "assistant", text: t.voiceTranscribeError }]);
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: t.micPermissionError }]);
    }
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
    if (cart.length === 0 || loading) return;

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
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && last.text === result.reason) {
          return prev;
        }
        return [...prev, { role: "assistant", text: result.reason }];
      });
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
              ? `${t.paymentSuccessPrefix} ${customer.email}.`
              : t.paymentFailed,
          },
        ]);
        setCart([]);
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          setMessages((prev) => [...prev, { role: "assistant", text: t.checkoutCancelled }]);
        },
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
    <div className="chat-layout">
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-title">Panya</div>
          <div className="chat-header-right">
            {customer.name && <div className="chat-header-greeting">{t.welcome(customer.name)}</div>}
            <select
              className="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length <= 1 && (
            <div className="suggestion-chips">
              {["Casual wear", "Something formal", "Workout gear", "Gift under ₹1000"].map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

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
                <p>{pendingMatch.reply}</p>
              </div>
              {pendingMatch.upsell && (
                <div className="product-preview upsell-preview">
                  {pendingMatch.upsell.imageUrl && (
                    <img src={pendingMatch.upsell.imageUrl} alt={pendingMatch.upsell.name} className="product-thumb small" />
                  )}
                  <p className="upsell-reason">
                    {t.suggestedPrefix} {pendingMatch.upsell.name} (₹{pendingMatch.upsell.price}) — {pendingMatch.upsellReason}
                  </p>
                </div>
              )}
              <div className="upsell-actions">
                <button onClick={() => handleAddPending(false)}>{t.addItemBtn}</button>
                {pendingMatch.upsell && (
                  <button onClick={() => handleAddPending(true)}>{t.addItemSuggestionBtn}</button>
                )}
              </div>
            </div>
          )}

          {showCustomerForm && (
            <div className="customer-form-card">
              <p>{t.receiptQuestion}</p>
              <form onSubmit={handleCustomerSubmit}>
                <input placeholder={t.namePlaceholder} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                <input type="email" placeholder={t.emailPlaceholder} value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
                <button type="submit">{t.continueToPayment}</button>
              </form>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chat-input-bar">
          {VOICE_SUPPORTED && (
            <button
              type="button"
              className={`mic-btn ${recording ? "recording" : ""}`}
              onClick={toggleRecording}
              disabled={loading || transcribing}
              title={recording ? t.micTooltipStop : t.micTooltipStart}
            >
              {recording ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setVoiceOriginated(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder={transcribing ? t.transcribingPlaceholder : t.inputPlaceholder}
            disabled={loading || recording || transcribing}
          />
          <button onClick={() => handleSend()} disabled={loading || recording || transcribing}>
            {t.sendBtn}
          </button>
        </div>
      </div>

      <div className="cart-panel">
        <div className="cart-panel-title">{t.yourOrder}</div>
        {cart.length === 0 ? (
          <div className="cart-empty">{t.cartEmpty}</div>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.productId} className="cart-row">
                <span>{item.name} × {item.qty}</span>
                <span>₹{item.price * item.qty}</span>
                <button className="cart-remove" onClick={() => removeFromCart(item.productId)}>{t.removeBtn}</button>
              </div>
            ))}
            <div className="cart-total-row">
              <span>{t.total}</span>
              <span>₹{cartTotal}</span>
            </div>
            {rules && (
              <div className={`rule-tag ${withinLimit ? "ok" : "blocked"}`}>
                {withinLimit ? t.withinLimit(rules.maxOrderValue) : t.exceedsLimit(rules.maxOrderValue)}
              </div>
            )}
            <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
              {t.checkoutBtn}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;