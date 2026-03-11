import React, { useState } from "react";

const fmtUSD = (n) => "$" + Math.round(n / 1000).toLocaleString("en-US") + "K";
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// Detect Crehana cross-sell signals from interview data
const detectCrehanaSignals = (summary) => {
  if (!summary) return [];
  const signals = [];
  const all = [
    ...(summary.opportunities || []),
    ...(summary.negatives || []),
    ...(summary.positives || []),
    summary.executive || "",
  ];
  const text = all.join(" ").toLowerCase();

  // HCM signals
  if (text.includes("hr") || text.includes("rrhh") || text.includes("recursos humanos") || text.includes("gestión de personas")) {
    signals.push({ type: "HCM", signal: "HR / People management needs identified", strength: "high" });
  }
  if (text.includes("talent") || text.includes("ats") || text.includes("reclutamiento")) {
    signals.push({ type: "HCM", signal: "Talent acquisition / ATS needs — uses external tool", strength: "high" });
  }
  if (text.includes("rotación") || text.includes("finiquito")) {
    signals.push({ type: "HCM", signal: "High turnover — needs retention & workforce analytics", strength: "high" });
  }
  if (text.includes("dashboard") && (text.includes("analítico") || text.includes("analyt"))) {
    signals.push({ type: "HCM", signal: "Wants HR analytics dashboards", strength: "high" });
  }
  if (text.includes("vacaciones") || text.includes("incidencias")) {
    signals.push({ type: "HCM", signal: "Leave / absence management gaps", strength: "medium" });
  }
  if (text.includes("módulo rrhh") || text.includes("modulo rrhh")) {
    signals.push({ type: "HCM", signal: "Explicitly needs expanded HR module", strength: "high" });
  }

  // L&D signals
  if (text.includes("capacitación") || text.includes("training") || text.includes("desarrollo")) {
    signals.push({ type: "L&D", signal: "Training / development needs mentioned", strength: "high" });
  }
  if (text.includes("onboarding") || (text.includes("rotación") && text.includes("alta"))) {
    signals.push({ type: "L&D", signal: "High turnover → onboarding & training opportunity", strength: "medium" });
  }

  // General enterprise readiness
  if (text.includes("api") || text.includes("integra")) {
    signals.push({ type: "Platform", signal: "Integration-ready — open to connected ecosystem", strength: "medium" });
  }
  if (text.includes("automatización") || text.includes("automat")) {
    signals.push({ type: "Platform", signal: "Automation appetite — ready for platform expansion", strength: "medium" });
  }

  // Deduplicate by signal text
  const seen = new Set();
  return signals.filter((s) => {
    if (seen.has(s.signal)) return false;
    seen.add(s.signal);
    return true;
  });
};

export default function Upsell({ clients, onSelectClient }) {
  const [filter, setFilter] = useState("all");

  // Only customers with completed interviews
  const withSignals = clients
    .filter((c) => c.summary)
    .map((c) => ({
      ...c,
      crehanaSignals: detectCrehanaSignals(c.summary),
    }))
    .filter((c) => c.crehanaSignals.length > 0);

  let filtered = withSignals;
  if (filter === "hcm") filtered = withSignals.filter((c) => c.crehanaSignals.some((s) => s.type === "HCM"));
  if (filter === "ld") filtered = withSignals.filter((c) => c.crehanaSignals.some((s) => s.type === "L&D"));
  if (filter === "high") filtered = withSignals.filter((c) => c.crehanaSignals.some((s) => s.strength === "high"));

  filtered.sort((a, b) => b.crehanaSignals.length - a.crehanaSignals.length);

  const totalARR = withSignals.reduce((s, c) => s + (c.billingUSD || 0), 0);
  const hcmCount = withSignals.filter((c) => c.crehanaSignals.some((s) => s.type === "HCM")).length;
  const ldCount = withSignals.filter((c) => c.crehanaSignals.some((s) => s.type === "L&D")).length;
  const highCount = withSignals.filter((c) => c.crehanaSignals.some((s) => s.strength === "high")).length;

  const typeColor = { HCM: "var(--primary)", "L&D": "var(--green)", Platform: "var(--blue)" };
  const typeBg = { HCM: "var(--primary-bg)", "L&D": "var(--green-bg)", Platform: "var(--blue-bg)" };
  const strengthColor = { high: "var(--red)", medium: "var(--yellow)", low: "var(--text-muted)" };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Crehana Cross-sell Potential</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
        HCM &amp; L&D opportunities identified from {withSignals.length} completed interviews
      </p>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="kpi-card">
          <div className="label">Customers with Signals</div>
          <div className="value purple">{withSignals.length}</div>
          <div className="sub">{fmtUSD(totalARR)} current ARR</div>
        </div>
        <div className="kpi-card">
          <div className="label">HCM Opportunity</div>
          <div className="value" style={{ color: "var(--primary-lt)" }}>{hcmCount}</div>
          <div className="sub">HR, Talent, Analytics needs</div>
        </div>
        <div className="kpi-card">
          <div className="label">L&D Opportunity</div>
          <div className="value green">{ldCount}</div>
          <div className="sub">Training, Onboarding needs</div>
        </div>
        <div className="kpi-card">
          <div className="label">High Strength</div>
          <div className="value red">{highCount}</div>
          <div className="sub">explicit need mentioned</div>
        </div>
      </div>

      <div className="filters">
        {[
          ["all", "All Signals"],
          ["hcm", "HCM"],
          ["ld", "L&D"],
          ["high", "High Strength"],
        ].map(([key, label]) => (
          <button key={key} className={`filter-btn ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {filtered.map((c) => (
        <div key={c.id} className="theme-card" style={{ marginBottom: 16, cursor: "pointer" }} onClick={() => onSelectClient(c)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <h3 style={{ marginBottom: 2 }}>{c.cliente}</h3>
              <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-muted)" }}>
                <span>{c.producto}</span>
                <span>&middot; Hosting: {c.hosting}</span>
                <span>&middot; {fmtUSD(c.billingUSD || 0)} ARR</span>
                <span>&middot; Renewal: {fmtDate(c.vigencia)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {c.crehanaSignals.some((s) => s.type === "HCM") && (
                <span style={{ background: "var(--primary-bg)", color: "var(--primary-lt)", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>HCM</span>
              )}
              {c.crehanaSignals.some((s) => s.type === "L&D") && (
                <span style={{ background: "var(--green-bg)", color: "var(--green)", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>L&D</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {c.crehanaSignals.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{
                  background: typeBg[s.type],
                  color: typeColor[s.type],
                  padding: "2px 6px",
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  minWidth: 48,
                  textAlign: "center",
                }}>{s.type}</span>
                <span style={{ color: "var(--text)", flex: 1 }}>{s.signal}</span>
                <span style={{
                  color: strengthColor[s.strength],
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}>{s.strength}</span>
              </div>
            ))}
          </div>

          {/* Interview context */}
          <div style={{ marginTop: 10, padding: "8px 0 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>From interview:</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {c.summary.executive}
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="no-data">
          <h3>No signals match this filter</h3>
          <p>Try a different filter or complete more interviews to identify Crehana cross-sell opportunities.</p>
        </div>
      )}
    </div>
  );
}
