import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function Nav() {
  const location = useLocation();
  if (location.pathname === "/") return null;

  return (
    <nav className="top-nav">
      <Link to="/">Panya</Link>
      <Link to="/chat">Chat</Link>
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
        <Route path="/chat" element={<Chat />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;