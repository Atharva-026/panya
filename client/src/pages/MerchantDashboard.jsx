import { useState, useEffect } from "react";
import {
  fetchMerchantDashboard,
  fetchMerchantAnalytics,
  fetchMerchantInsights,
  refreshMerchantInsights,
} from "../api/client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
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
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function loadAll() {
    Promise.all([fetchMerchantDashboard(), fetchMerchantAnalytics(), fetchMerchantInsights()]).then(
      ([dashboardRes, analyticsRes, insightsRes]) => {
        setData(dashboardRes);
        setAnalytics(analyticsRes);
        setInsights(insightsRes);
        setLoading(false);
      }
    );
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleRefreshInsights() {
    setRefreshing(true);
    const updated = await refreshMerchantInsights();
    setInsights(updated);
    setRefreshing(false);
  }

  if (loading) return <div className="dashboard-page">Loading...</div>;
  if (!data) return <div className="dashboard-page">Failed to load dashboard.</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header-row">
        <div className="dashboard-header">Merchant Dashboard</div>
        <a href="/merchant/products" className="manage-products-link">Manage Products →</a>
      </div>

      {insights?.spikeAlert?.triggered && (
        <div className="spike-banner">{insights.spikeAlert.message}</div>
      )}

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

      {analytics && (
        <div className="analytics-section">
          <div className="section-title">Revenue — last 30 days</div>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#1a1a1a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics-grid">
            <div className="chart-card">
              <div className="chart-card-title">Top products</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.topProducts} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="unitsSold" fill="#1a1a1a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-card-title">Revenue by category</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.revenueByCategory}>
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {analytics.restockUrgency.length > 0 && (
            <div className="restock-card">
              <div className="chart-card-title">Restock priority</div>
              {analytics.restockUrgency.map((r) => (
                <div key={r.productId} className="restock-row">
                  <span>{r.name}</span>
                  <span>{r.stock} left</span>
                  <span>{r.daysOfStockLeft < 1 ? "< 1 day" : `~${Math.round(r.daysOfStockLeft)} days`} of stock</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="insight-section">
        <div className="insight-header">
          <div className="section-title">AI Insights</div>
          <button className="refresh-btn" onClick={handleRefreshInsights} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh insights"}
          </button>
        </div>
        {insights?.generatedAt && (
          <div className="insight-updated">Last updated {formatTimestamp(insights.generatedAt)}</div>
        )}
        {insights?.narrative?.length > 0 ? (
          <ul className="insight-list">
            {insights.narrative.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <div className="insight-empty">No insights generated yet — click "Refresh insights" to generate one.</div>
        )}
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