import { useState, useEffect } from "react";
import "./Dashboard.css";

function formatRupees(amount) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guest = sessionStorage.getItem("panya_guest");
    const email = guest ? JSON.parse(guest).email : null;
    const url = email ? `/api/user/orders?email=${encodeURIComponent(email)}` : "/api/user/orders";

    fetch(url, { credentials: "include" })
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="dashboard-page">Loading...</div>;
  if (!data || data.error) return <div className="dashboard-page">No orders yet.</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">Your Orders</div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">{formatRupees(data.totalSpent)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{data.orderCount}</div>
        </div>
      </div>

      <div className="audit-section">
        <div className="section-title">Order History</div>
        <div className="audit-list">
          {data.orders.map((order) => (
            <div key={order._id} className="audit-row">
              <div className="audit-action">{order.items.map((item) => item.name).join(", ")}</div>
              <div className="audit-meta">{formatRupees(order.amount)} · {formatTimestamp(order.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
