import { useState, useEffect } from "react";
import { fetchMerchantDashboard } from "../api/client";
import "./Dashboard.css";

function formatRupees(amount) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MerchantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMerchantDashboard().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="dashboard-page">Loading...</div>;
  if (!data) return <div className="dashboard-page">Failed to load dashboard.</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">Merchant Dashboard</div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{formatRupees(data.totalRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{data.totalOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Upsell Revenue</div>
          <div className="stat-value">{formatRupees(data.upsellRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Upsell Orders</div>
          <div className="stat-value">{data.upsellOrderCount}</div>
        </div>
      </div>

      <div className="rules-section">
        <div className="section-title">Spend Rules</div>
        <div className="rules-row">
          <span>Max order value</span>
          <span>{formatRupees(data.merchantRules.maxOrderValue)}</span>
        </div>
        <div className="rules-row">
          <span>Daily spend cap</span>
          <span>{formatRupees(data.merchantRules.dailySpendCap)}</span>
        </div>
      </div>

      <div className="audit-section">
        <div className="section-title">Audit Trail</div>
        <div className="audit-list">
          {data.recentAuditLogs.map((log) => (
            <div key={log._id} className="audit-row">
              <div className="audit-action">{log.action.replace(/_/g, " ")}</div>
              <div className="audit-reason">{log.reason}</div>
              <div className="audit-meta">
                {log.amount ? formatRupees(log.amount) : ""} · {formatTimestamp(log.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MerchantDashboard;