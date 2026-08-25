import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";

function SignIn() {
  const navigate = useNavigate();
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function handleGoogleSignIn() {
    window.location.href = "http://localhost:3001/api/auth/google";
  }

  function handleGuestSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    sessionStorage.setItem("panya_guest", JSON.stringify({ name, email }));
    navigate("/chat");
  }

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-name">Panya</div>
        <p className="signin-subtitle">Sign in to start shopping with your assistant.</p>
        <button className="google-btn" onClick={handleGoogleSignIn}>
          Continue with Google
        </button>

        <div className="signin-divider">or</div>

        {!showGuestForm ? (
          <button className="guest-btn" onClick={() => setShowGuestForm(true)}>
            Continue as guest
          </button>
        ) : (
          <form onSubmit={handleGuestSubmit} className="guest-form">
            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="guest-btn">Continue</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SignIn;