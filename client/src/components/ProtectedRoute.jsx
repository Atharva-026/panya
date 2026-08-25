import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { checkAuth } from "../api/client";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const guest = sessionStorage.getItem("panya_guest");
    if (guest) {
      setStatus("authed");
      return;
    }

    checkAuth().then((data) => {
      setStatus(data.authenticated ? "authed" : "unauthed");
    });
  }, []);

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthed") return <Navigate to="/signin" replace />;
  return children;
}

export default ProtectedRoute;