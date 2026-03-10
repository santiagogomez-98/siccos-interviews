import React, { useState } from "react";

const fmtUSD = (n) => "$" + Math.round(n / 1000).toLocaleString("en-US") + "K";
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function Upsell({ clients, onSelectClient }) {
  const [filter, setFilter] = useState("all");

  // Identify upsell/cross-sell opportunities
  const opportunities = clients.map((c) => {
    const signals = [];
    let potential = null;

    // Seg. Social only → cross-sell to Integral
    if (c.producto === "Seguridad Social") {
      signals.push("Cross-sell: Seg. Social only — potential for full Integral migration");
      potential = "high";
    }

    // Not hosted → upsell to hosting
    if (c.hosting === "NO" && c.producto === "Integral") {
      signals.push("Upsell: Not on hosted — migrate to cloud hosting");
      potential = potential || "medium";
    }

    // From interview insights
    if (c.summary) {
      const opps = c.summary.opportunities || [];
      opps.forEach((o) => {
        if (o.toLowerCase().includes("api") || o.toLowerCase().includes("integra")) {
          signals.push("Upsell: API/Integration needs identified in interview");
        }
        if (o.toLowerCase().includes("hr") || o.toLowerCase().includes("talent") || o.toLowerCase().includes("rrhh")) {
          signals.push("Upsell: HR/Talent module expansion opportunity");
        }
        if (o.toLowerCase().includes("dashboard") || o.toLowerCase().includes("analyt")) {
          signals.push("Upsell: Analytics/Dashboard add-on opportunity");
        }
        if (o.toLowerCase().includes("migrar") || o.toLowerCase().includes("migra") || o.toLowerCase().includes("payroll migration")) {
          signals.push("Cross-sell: Full payroll migration potential");
          potential = "high";
        }
      });
    }

    // High billing + basic product = high potential
    if ((c.billingUSD || 0) > 30000 && c.producto === "Seguridad Social") {
      potential = "high";
    }

    return { ...c, upsellSignals: signals, upsellPotential: potential || (signals.length > 0 ? "low" : null) };
  }).filter((c) => c.upsellSignals.length > 0);

  let filtered = opportunities;
  if (filter === "high") filtered = opportunities.filter((c) => c.upsellPotential === "high");
  if (filter === "medium") filtered = opportunities.filter((c) => c.upsellPotential === "medium");
  if (filter === "cross_sell") filtered = opportunities.filter((c) => c.producto === "Seguridad Social");
  if (filter === "hosting_upsell") filtered = opportunities.filter((c) => c.hosting === "NO" && c.producto === "Integral");

  filtered.sort((a, b) => (b.billingUSD || 0) - (a.billingUSD || 0));

  const totalPotentialBilling = filtered.reduce((s, c) => s + (c.billingUSD || 0), 0);
  const highCount = opportunities.filter((c) => c.upsellPotential === "high").length;
  const crossSellCount = opportunities.filter((c) => c.producto === "Seguridad Social").length;
  const hostingUpsellCount = opportunities.filter((c) => c.hosting === "NO" && c.producto === "Integral").length;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Upsell / Cross-sell Potential</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
        {opportunities.length} clients with identified opportunities &middot; {fmtUSD(totalPotentialBilling)} in current billing
      </p>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="kpi-card">
          <div className="label">Total Opportunities</div>
          <div className="value purple">{opportunities.length}</div>
          <div className="sub">of {clients.length} total clients</div>
        </div>
        <div className="kpi-card">
          <div className="label">High Potential</div>
          <div className="value red">{highCount}</div>
          <div className="sub">cross-sell or major upsell</div>
        </div>
        <div className="kpi-card">
          <div className="label">Cross-sell (Seg. Social → Integral)</div>
          <div className="value yellow">{crossSellCount}</div>
          <div className="sub">currently Seg. Social only</div>
        </div>
        <div className="kpi-card">
          <div className="label">Hosting Upsell</div>
          <div className="value blue">{hostingUpsellCount}</div>
          <div className="sub">Integral not hosted</div>
        </div>
      </div>

      <div className="filters">
        {[
          ["all", "All Opportunities"],
          ["high", "High Potential"],
          ["cross_sell", "Cross-sell (Seg. Social)"],
          ["hosting_upsell", "Hosting Upsell"],
        ].map(([key, label]) => (
          <button key={key} className={`filter-btn ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Current Product</th>
              <th>Hosting</th>
              <th>Billing (USD)</th>
              <th>Renewal</th>
              <th>Potential</th>
              <th>Opportunity Signals</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="clickable" onClick={() => onSelectClient(c)}>
                <td>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{c.cliente}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{c.id}</div>
                </td>
                <td style={{ fontSize: 12 }}>{c.producto}</td>
                <td style={{ fontSize: 12 }}>{c.hosting}</td>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{fmtUSD(c.billingUSD || 0)}</td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDate(c.vigencia)}</td>
                <td>
                  <span className={`badge ${c.upsellPotential}`}>{c.upsellPotential}</span>
                </td>
                <td style={{ fontSize: 11, color: "#CBD5E1", maxWidth: 300 }}>
                  {c.upsellSignals.map((s, i) => (
                    <div key={i} style={{ padding: "2px 0" }}>{s}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
