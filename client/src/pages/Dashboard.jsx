import { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { fetchUserAnalytics } from "../api/client";
import "./Dashboard.css";

function formatRupees(amount) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guest = sessionStorage.getItem("panya_guest");
    const email = guest ? JSON.parse(guest).email : null;
    const url = email ? `/api/user/orders?email=${encodeURIComponent(email)}` : "/api/user/orders";

    Promise.all([
      fetch(url, { credentials: "include" }).then((res) => res.json()),
      fetchUserAnalytics(),
    ]).then(([ordersRes, analyticsRes]) => {
      setData(ordersRes);
      setAnalytics(analyticsRes);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="dashboard-page">Loading...</div>;
  if (!data || data.error) return <div className="dashboard-page">No orders yet.</div>;

  const avgOrderValue = data.orderCount > 0 ? data.totalSpent / data.orderCount : 0;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">Your Dashboard</div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">{formatRupees(data.totalSpent)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{data.orderCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Order</div>
          <div className="stat-value">{formatRupees(avgOrderValue)}</div>
        </div>
      </div>

      {analytics && (
        <div className="analytics-section">
          <div className="section-title">Your spending — last 30 days</div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.spendingByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0C8" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#8B7FC4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics-grid">
            <div className="chart-card">
              <div className="chart-card-title">Your top items</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.topItems} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="unitsBought" fill="#8B7FC4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-card-title">Spending by category</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.categoryBreakdown}>
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#8B7FC4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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