import React from "react";
import allClientsRaw from "../data/allClients";

const fmtUSD = (n) => "$" + Math.round(n / 1000).toLocaleString("en-US") + "K";
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const daysUntil = (d) => {
  if (!d) return Infinity;
  return Math.ceil((new Date(d + "T00:00:00") - new Date("2026-03-10T00:00:00")) / 86400000);
};

const getSatisfaction = (summary) => {
  if (!summary) return null;
  const pos = summary.positives?.length || 0;
  const neg = summary.negatives?.length || 0;
  const total = pos + neg;
  if (total === 0) return null;
  return Math.round((pos / total) * 100) / 10;
};

const satisfactionColor = (score) => {
  if (score >= 7) return "var(--green)";
  if (score >= 5) return "var(--yellow)";
  return "var(--red)";
};

const crossHighlights = {
  strengths: [
    { theme: "Fast payroll calculation & multi-user", clients: ["Merco", "Criogas", "Galdisa"] },
    { theme: "Integrated platform (payroll + SUA + timbrado)", clients: ["Criogas", "Galdisa", "Whirlpool", "Merco"] },
    { theme: "User-friendly interface vs legacy systems", clients: ["Merco", "Criogas"] },
    { theme: "Improved support after management change", clients: ["Merco", "Galdisa", "Criogas"] },
  ],
  painPoints: [
    { theme: "Slow timbrado/confronta at scale", clients: ["Merco", "Whirlpool"], severity: "high" },
    { theme: "Support quality & advisor rotation", clients: ["Merco", "Whirlpool", "Galdisa"], severity: "high" },
    { theme: "Bugs after system updates without root cause", clients: ["Criogas"], severity: "medium" },
    { theme: "SUA report format discrepancies vs IMSS", clients: ["Galdisa"], severity: "medium" },
  ],
  opportunities: [
    { theme: "Performance optimization at scale", clients: ["Merco", "Whirlpool"], priority: "critical" },
    { theme: "SLA framework with urgency levels", clients: ["Merco"], priority: "high" },
    { theme: "API / integration layer", clients: ["Criogas", "Galdisa"], priority: "medium" },
    { theme: "Analytics & HR dashboards", clients: ["Merco"], priority: "high" },
  ],
};

export default function Dashboard({ data, onSelectClient }) {
  const { interviews } = data;
  const completed = interviews.filter((i) => i.interviewStatus === "completed" && i.summary);
  const toComplete = interviews.filter((i) => i.interviewStatus !== "completed" || !i.summary);

  const totalCustomers = allClientsRaw.length;
  const totalBaseARR = allClientsRaw.reduce((s, c) => s + (c.billingUSD || 0), 0);
  const interviewedARR = completed.reduce((s, c) => s + (c.billingUSD || 0), 0);
  const targetARR = interviews.reduce((s, c) => s + (c.billingUSD || 0), 0);

  const pctCustomersInterviewed = ((completed.length / totalCustomers) * 100).toFixed(1);
  const pctCustomersTarget = ((interviews.length / totalCustomers) * 100).toFixed(1);
  const pctARRofBase = totalBaseARR > 0 ? ((interviewedARR / totalBaseARR) * 100).toFixed(1) : 0;
  const pctARRofTarget = targetARR > 0 ? ((interviewedARR / targetARR) * 100).toFixed(0) : 0;

  const scores = completed.map((c) => getSatisfaction(c.summary)).filter(Boolean);
  const avgSatisfaction = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Interview Progress</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
        {completed.length} of {interviews.length} interviews completed &middot; {fmtUSD(interviewedARR)} ARR covered
      </p>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="kpi-card">
          <div className="label">Interviews Completed</div>
          <div className="value green">{completed.length}/{interviews.length}</div>
          <div className="sub">{pctCustomersInterviewed}% of {totalCustomers} total customers</div>
          <div className="progress-bar">
            <div className="progress-fill purple" style={{ width: `${(completed.length / interviews.length) * 100}%` }} />
          </div>
        </div>
        <div className="kpi-card">
          <div className="label">ARR Interviewed</div>
          <div className="value purple">{fmtUSD(interviewedARR)}/{fmtUSD(targetARR)}</div>
          <div className="sub">{pctARRofBase}% of {fmtUSD(totalBaseARR)} total customer base</div>
          <div className="progress-bar">
            <div className="progress-fill purple" style={{ width: `${pctARRofTarget}%` }} />
          </div>
        </div>
        <div className="kpi-card">
          <div className="label">Avg. Satisfaction</div>
          <div className="value" style={{ color: satisfactionColor(parseFloat(avgSatisfaction)) }}>{avgSatisfaction}/10</div>
          <div className="sub">across {completed.length} interviews</div>
        </div>
      </div>

      {/* Completed Interviews */}
      <div className="section">
        <div className="section-title" style={{ color: "var(--green)" }}>Completed Interviews</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Hosting</th>
                <th>ARR (USD)</th>
                <th>Renewal</th>
                <th>Satisfaction</th>
                <th>Sentiment</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {completed
                .sort((a, b) => (b.billingUSD || 0) - (a.billingUSD || 0))
                .map((c) => {
                  const score = getSatisfaction(c.summary);
                  return (
                    <tr key={c.id} className="clickable" onClick={() => onSelectClient(c)}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{c.cliente}</div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{c.id}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{c.producto}</td>
                      <td style={{ fontSize: 12 }}>{c.hosting}</td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{fmtUSD(c.billingUSD || 0)}</td>
                      <td>
                        <span style={{
                          color: daysUntil(c.vigencia) <= 30 ? "var(--red)" : daysUntil(c.vigencia) <= 90 ? "var(--yellow)" : "var(--text-muted)",
                          fontSize: 12,
                        }}>
                          {fmtDate(c.vigencia)}
                          {daysUntil(c.vigencia) <= 90 && <span style={{ fontSize: 10, marginLeft: 3 }}>({daysUntil(c.vigencia)}d)</span>}
                        </span>
                      </td>
                      <td>
                        {score && (
                          <span style={{ fontWeight: 700, fontSize: 14, color: satisfactionColor(score) }}>
                            {score}
                          </span>
                        )}
                      </td>
                      <td><span className={`badge ${c.summary?.sentiment}`}>{c.summary?.sentiment}</span></td>
                      <td><span className={`badge ${c.summary?.riskLevel}`}>{c.summary?.riskLevel}</span></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* To Be Completed */}
      <div className="section">
        <div className="section-title" style={{ color: "var(--text-muted)" }}>To Be Completed ({toComplete.length})</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Status</th>
                <th>Product</th>
                <th>Hosting</th>
                <th>ARR (USD)</th>
                <th>Renewal</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {toComplete
                .sort((a, b) => (b.billingUSD || 0) - (a.billingUSD || 0))
                .map((c) => (
                  <tr key={c.id} className="clickable" onClick={() => onSelectClient(c)}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{c.cliente}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{c.id}</div>
                    </td>
                    <td><span className={`badge ${c.interviewStatus}`}>
                      {c.interviewStatus === "scheduled" ? "Scheduled" : c.interviewStatus === "scheduling" ? "Scheduling" : "Not Contacted"}
                    </span></td>
                    <td style={{ fontSize: 12 }}>{c.producto}</td>
                    <td style={{ fontSize: 12 }}>{c.hosting}</td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{fmtUSD(c.billingUSD || 0)}</td>
                    <td>
                      <span style={{
                        color: daysUntil(c.vigencia) <= 30 ? "var(--red)" : daysUntil(c.vigencia) <= 90 ? "var(--yellow)" : "var(--text-muted)",
                        fontSize: 12,
                      }}>
                        {fmtDate(c.vigencia)}
                        {daysUntil(c.vigencia) <= 90 && daysUntil(c.vigencia) >= 0 && <span style={{ fontSize: 10, marginLeft: 3 }}>({daysUntil(c.vigencia)}d)</span>}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {c.notas || (c.fechaReunion ? `${fmtDate(c.fechaReunion)} ${c.horario || ""}` : "—")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Interview Highlights */}
      <div className="section">
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Cross-Interview Highlights</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
          Patterns that repeat across {completed.length} completed interviews
        </p>
        <div className="insight-grid">
          <div className="insight-card pos">
            <h3 className="positive">Common Strengths</h3>
            <ul>
              {crossHighlights.strengths.map((t, i) => (
                <li key={i}>
                  <strong>{t.theme}</strong>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{t.clients.join(", ")}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="insight-card neg">
            <h3 className="negative">Common Pain Points</h3>
            <ul>
              {crossHighlights.painPoints.map((t, i) => (
                <li key={i}>
                  <strong>{t.theme}</strong>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                    <span className={`badge ${t.severity}`} style={{ fontSize: 10 }}>{t.severity}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{t.clients.join(", ")}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="insight-card opp">
            <h3 className="opportunity">Key Opportunities</h3>
            <ul>
              {crossHighlights.opportunities.map((t, i) => (
                <li key={i}>
                  <strong>{t.theme}</strong>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                    <span className={`badge ${t.priority}`} style={{ fontSize: 10 }}>{t.priority}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{t.clients.join(", ")}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
