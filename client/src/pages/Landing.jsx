import { useNavigate } from "react-router-dom";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-name">Panya</div>
        <div className="landing-origin">Sanskrit, पण्य — merchandise, goods for sale</div>
        <div className="landing-tagline">
          An AI agent that sells, upsells, and accounts for every rupee.
        </div>
        <p className="landing-description">
          Panya talks to customers, completes payments through Razorpay, and
          gives merchants a clear, auditable record of every decision it makes.
        </p>
        <div className="landing-actions">
          <button className="primary" onClick={() => navigate("/chat")}>
            Try the assistant
          </button>
          <button className="secondary" onClick={() => navigate("/merchant")}>
            View merchant dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Landing;