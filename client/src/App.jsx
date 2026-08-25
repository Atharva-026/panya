import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import Chat from "./pages/Chat";
import Storefront from "./pages/Storefront";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function Nav() {
  const location = useLocation();
  if (location.pathname === "/" || location.pathname === "/signin") return null;

  return (
    <nav className="top-nav">
      <Link to="/">Panya</Link>
      <Link to="/chat">Chat</Link>
      <Link to="/store">Store</Link>
      <Link to="/dashboard">Dashboard</Link>
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;