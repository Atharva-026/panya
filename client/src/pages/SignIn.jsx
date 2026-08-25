import "./SignIn.css";

function SignIn() {
  function handleGoogleSignIn() {
    window.location.href = "http://localhost:3001/api/auth/google";
  }

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-name">Panya</div>
        <p className="signin-subtitle">Sign in to start shopping with your assistant.</p>
        <button className="google-btn" onClick={handleGoogleSignIn}>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default SignIn;