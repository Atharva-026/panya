import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Storefront from "./pages/Storefront";
import MerchantDashboard from "./pages/MerchantDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { logout } from "./api/client";
import "./App.css";

function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === "/" || location.pathname === "/signin") return null;

  async function handleLogout() {
    sessionStorage.removeItem("panya_guest");
    await logout();
    navigate("/");
  }

  return (
    <nav className="top-nav">
      <Link to="/">Panya</Link>
      <Link to="/chat">Chat</Link>
      <Link to="/store">Store</Link>
      <Link to="/dashboard">Dashboard</Link>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;