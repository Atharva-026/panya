import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Storefront from "./pages/Storefront";
import MerchantDashboard from "./pages/MerchantDashboard";
import MerchantProducts from "./pages/MerchantProducts";
import Automation from "./pages/Automation";
import ProtectedRoute from "./components/ProtectedRoute";
import { logout, checkAuth } from "./api/client";
import "./App.css";

function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "", email: "" });

  useEffect(() => {
    const guest = sessionStorage.getItem("panya_guest");
    if (guest) {
      setProfile(JSON.parse(guest));
    } else {
      checkAuth().then((data) => {
        if (data.authenticated) {
          setProfile({ name: data.user.name, email: data.user.email });
        }
      });
    }
  }, [location.pathname]);

  if (location.pathname === "/" || location.pathname === "/signin" || location.pathname === "/merchant") return null;

  async function handleLogout() {
    sessionStorage.removeItem("panya_guest");
    await logout();
    navigate("/");
  }

  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "";

  return (
    <nav className="top-nav">
      <Link to="/">Panya</Link>
      <Link to="/chat">Chat</Link>
      <Link to="/store">Store</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/automation">Automation</Link>
      {profile.name && (
        <div className="nav-profile">
          <div className="nav-avatar">{initials}</div>
          <span className="nav-profile-name">{profile.name}</span>
        </div>
      )}
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/store" element={<Storefront />} />
        <Route path="/merchant" element={<MerchantDashboard />} />
        <Route path="/merchant/products" element={<MerchantProducts />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automation"
          element={
            <ProtectedRoute>
              <Automation />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;