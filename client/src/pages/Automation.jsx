import { useState, useEffect } from "react";
import {
  fetchAutoOrderRules,
  createAutoOrderRule,
  toggleAutoOrderRule,
  deleteAutoOrderRule,
  runAutoOrderNow,
} from "../api/client";
import "./Automation.css";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Automation() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [runningId, setRunningId] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  function loadRules() {
    fetchAutoOrderRules().then((data) => {
      setRules(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!goal.trim() || !budget) return;
    await createAutoOrderRule(goal, Number(budget), frequency);
    setGoal("");
    setBudget("");
    setShowForm(false);
    loadRules();
  }

  async function handleToggle(id) {
    await toggleAutoOrderRule(id);
    loadRules();
  }

  async function handleDelete(id) {
    await deleteAutoOrderRule(id);
    loadRules();
  }

  async function handleRunNow(id) {
    setRunningId(id);
    setLastResult(null);
    try {
      const result = await runAutoOrderNow(id);
      setLastResult({ id, ...result });

      if (result.success && result.paymentLink?.dbOrderId) {
        pollPaymentStatus(id, result.paymentLink.dbOrderId);
      }
    } catch (err) {
      setLastResult({ id, success: false, reason: "Something went wrong. Check server logs." });
    }
    setRunningId(null);
    loadRules();
  }

  function pollPaymentStatus(ruleId, orderId, attempt = 0) {
    if (attempt > 20) return;

    setTimeout(async () => {
      const res = await fetch(`/api/order/payment-link-status/${orderId}`, { credentials: "include" });
      const data = await res.json();

      if (data.status === "paid") {
        setLastResult((prev) =>
          prev && prev.id === ruleId ? { ...prev, paid: true } : prev
        );
        loadRules();
      } else {
        pollPaymentStatus(ruleId, orderId, attempt + 1);
      }
    }, 6000);
  }

  if (loading) return <div className="automation-page">Loading...</div>;

  return (
    <div className="automation-page">
      <div className="automation-header">
        <div>
          <div className="section-title">Auto-Order Rules</div>
          <p className="automation-subtitle">
            Let Panya's agent shop for you automatically on a schedule.
          </p>
        </div>
        <button className="new-rule-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New rule"}
        </button>
      </div>

      {showForm && (
        <form className="rule-form" onSubmit={handleCreate}>
          <input
            placeholder='What should the agent shop for? e.g. "casual wear"'
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <input
            type="number"
            placeholder="Budget (₹)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button type="submit">Create rule</button>
        </form>
      )}

      {rules.length === 0 && !showForm && (
        <div className="automation-empty">No auto-order rules set up yet.</div>
      )}

      <div className="rule-list">
        {rules.map((rule) => (
          <div key={rule._id} className="rule-card">
            <div className="rule-info">
              <div className="rule-goal">{rule.goal}</div>
              <div className="rule-meta">
                ₹{rule.budget} budget · {rule.frequency} · next run {formatDate(rule.nextRunDate)}
              </div>
              <div className={`rule-status ${rule.active ? "active" : "paused"}`}>
                {rule.active ? "Active" : "Paused"}
              </div>
            </div>
            <div className="rule-actions">
              <button onClick={() => handleRunNow(rule._id)} disabled={runningId === rule._id}>
                {runningId === rule._id ? "Running..." : "Run now"}
              </button>
              <button onClick={() => handleToggle(rule._id)}>
                {rule.active ? "Pause" : "Resume"}
              </button>
              <button className="delete-btn" onClick={() => handleDelete(rule._id)}>Delete</button>
            </div>

            {lastResult && lastResult.id === rule._id && (
              <div className={`rule-result ${lastResult.success ? "success" : "failed"}`}>
                {lastResult.success ? (
                  <>
                    <p>Agent decision: {lastResult.decision.reasoning}</p>
                    <p>Amount: ₹{lastResult.paymentLink.amount}</p>
                    {!lastResult.paid ? (
                      <>
                        <a href={lastResult.paymentLink.paymentLinkUrl} target="_blank" rel="noreferrer" className="pay-link-btn">
                          Approve & Pay Now
                        </a>
                        <span className="waiting-badge">Waiting for payment...</span>
                      </>
                    ) : (
                      <span className="paid-badge">Paid — confirmation sent to your email</span>
                    )}
                  </>
                ) : (
                  `Could not complete: ${lastResult.reason}`
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Automation;