import { useNavigate } from "react-router-dom";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import "./Landing.css";

// Shared SVG filter that gives every icon a hand-drawn wobble.
// Rendered once, invisibly, then referenced by every icon via CSS filter.
function DoodleFilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter id="roughen">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
      </filter>
    </svg>
  );
}

function ShopDoodle({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={`doodle ${className || ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 24 C10 16 12 11 15 10 C24 8 40 8 49 10 C52 11 54 16 55 24" />
      <path d="M8 25 C13 28 16 27 18 24 C20 28 24 28 26 24 C28 28 33 28 35 24 C37 28 42 28 44 24 C46 28 50 28 55 25" />
      <path d="M9 25 L10 51 C10 53 12 54 14 54 L50 54 C52 54 54 53 54 51 L55 25" />
      <path d="M25 53 L25 38 C25 36 27 35 29 35 L36 35 C38 35 39 36 39 38 L39 53" />
    </svg>
  );
}

function VoiceDoodle({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={`doodle ${className || ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="16" r="9" />
      <path d="M11 50 C10 38 15 31 24 31 C29 31 33 33 36 37" />
      <rect x="35" y="27" width="19" height="29" rx="4" />
      <line x1="35" y1="47" x2="54" y2="47" />
      <path d="M40 20 C44 15 48 15 52 20" />
      <path d="M43 24 C45 21 47 21 49 24" />
    </svg>
  );
}

function PaymentDoodle({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={`doodle ${className || ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18 C9 15 11 14 14 14 L50 14 C53 14 55 16 55 19 L55 46 C55 49 53 51 50 51 L14 51 C11 51 9 49 9 46 Z" />
      <path d="M9 25 L55 25" />
      <line x1="16" y1="37" x2="30" y2="37" />
      <path d="M39 39 L43 43 L52 32" />
    </svg>
  );
}

function AutoOrderDoodle({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={`doodle ${className || ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="30" cy="34" r="21" />
      <path d="M30 20 L30 34 L41 40" />
      <path d="M22 8 C26 5 34 5 38 8" />
      <path d="M50 46 C54 48 57 52 56 56" />
      <path d="M56 56 L56 49 M56 56 L49 55" />
    </svg>
  );
}

function RevealRow({ children, className, reverse }) {
  const [ref, visible] = useRevealOnScroll();
  return (
    <div
      ref={ref}
      className={`feature-row ${reverse ? "reverse" : ""} reveal ${visible ? "visible" : ""} ${className || ""}`}
    >
      {children}
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <DoodleFilterDefs />

      <nav className="landing-nav">
        <div className="landing-nav-logo">पण्य</div>
        <div className="landing-nav-links">
          <button onClick={() => navigate("/chat")}>Try Assistant</button>
          <button onClick={() => navigate("/store")}>Store</button>
          <button onClick={() => navigate("/merchant")}>Merchant</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-logo">पण्य</div>
          <div className="hero-name">Panya</div>
          <div className="hero-meaning">Sanskrit for merchandise — goods worthy of trade</div>
          <p className="hero-tagline">
            An AI agent that sells, upsells, and accounts for every rupee.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate("/chat")}>
              Try the Assistant
            </button>
            <button className="btn-secondary" onClick={() => navigate("/store")}>
              Browse the Store
            </button>
          </div>
        </div>
      </section>

      <RevealRow className="intro-row">
        <div className="feature-text center wide">
          <p>
            Panya is a conversational AI shopping agent built on Razorpay's payment
            infrastructure. A customer describes what they want in plain language —
            typed or spoken, in the language they're most comfortable in — and Panya
            finds the right item, suggests a genuinely fitting pairing, and completes
            payment on the spot. Every decision it makes is explainable, bounded by
            rules the merchant sets, and recorded in a clear audit trail.
          </p>
        </div>
      </RevealRow>

      {/* WHAT IS PANYA */}
      <h2 className="section-title">What is Panya</h2>

      <RevealRow>
        <div className="feature-icon-box">
          <ShopDoodle className="feature-icon" />
        </div>
        <div className="feature-text">
          <h3>Profit for the merchant</h3>
          <p>
            Panya reasons about genuine product pairings and suggests them in the
            moment — real upsell revenue, not a hardcoded checkout nudge. Every
            payment is bounded by spend rules the merchant sets, gated before it
            happens, and recorded in a full audit trail.
          </p>
        </div>
      </RevealRow>

      <RevealRow reverse>
        <div className="feature-icon-box">
          <VoiceDoodle className="feature-icon" />
        </div>
        <div className="feature-text">
          <h3>Built for anyone to use</h3>
          <p>
            Voice input, voice output, and support for English, Hindi, Marathi,
            and Kannada mean anyone can shop by simply talking — no typing, no
            navigating menus, no comfort with English required.
          </p>
        </div>
      </RevealRow>

      <RevealRow>
        <div className="feature-icon-box">
          <AutoOrderDoodle className="feature-icon" />
        </div>
        <div className="feature-text">
          <h3>Shopping that happens on its own</h3>
          <p>
            Set a standing goal — "casual wear, weekly, under ₹1,000" — and
            Panya's agent shops for you on schedule, reasoning through the
            catalog like a real assistant would. One tap approves the payment;
            everything else runs itself, and you're always free to pause or
            cancel.
          </p>
        </div>
      </RevealRow>

      <RevealRow reverse>
        <div className="feature-icon-box">
          <PaymentDoodle className="feature-icon" />
        </div>
        <div className="feature-text">
          <h3>Powered by Razorpay</h3>
          <p>
            Every payment Panya completes runs on Razorpay's infrastructure —
            real order creation, signature-verified payments, and payment links,
            the same rails real Indian businesses transact on every day.
          </p>
        </div>
      </RevealRow>

      {/* MERCHANT DASHBOARD CALLOUT */}
      <RevealRow className="merchant-callout">
        <div className="feature-text center">
          <h3>Running a business on Panya?</h3>
          <p>Manage your catalog, spend rules, and revenue from one dashboard.</p>
          <button className="btn-secondary" onClick={() => navigate("/merchant")}>
            Merchant Dashboard
          </button>
        </div>
      </RevealRow>

      <footer className="landing-footer">
        <div className="footer-mark">पण्य</div>
      </footer>
    </div>
  );
}

export default Landing;