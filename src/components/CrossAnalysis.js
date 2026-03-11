import React, { useState } from "react";

const fmtUSD = (n) => "$" + Math.round(n / 1000).toLocaleString("en-US") + "K";

export default function CrossAnalysis({ data }) {
  const [productFilter, setProductFilter] = useState("all");
  const [hostingFilter, setHostingFilter] = useState("all");

  const allCompleted = data.interviews.filter(
    (i) => i.interviewStatus === "completed" && i.summary
  );

  // Apply filters
  const completed = allCompleted.filter((c) => {
    const matchProduct = productFilter === "all" || c.producto === productFilter;
    const matchHosting = hostingFilter === "all" ||
      (hostingFilter === "hosted" && c.hosting === "SI") ||
      (hostingFilter === "not_hosted" && c.hosting === "NO");
    return matchProduct && matchHosting;
  });

  if (allCompleted.length === 0) {
    return (
      <div className="no-data">
        <h3>No Completed Interviews</h3>
        <p>Summary will appear once interviews are completed.</p>
      </div>
    );
  }

  // Build themes dynamically from filtered interviews
  const customerNames = completed.map((c) => c.cliente.split(",")[0].split(" ").slice(0, 2).join(" "));

  // Aggregate all positives, negatives, opportunities
  const allPositives = {};
  const allNegatives = {};
  const allOpportunities = {};

  completed.forEach((c) => {
    const shortName = c.cliente.split(",")[0].split(" ").slice(0, 2).join(" ");
    (c.summary.positives || []).forEach((p) => {
      if (!allPositives[p]) allPositives[p] = [];
      allPositives[p].push(shortName);
    });
    (c.summary.negatives || []).forEach((n) => {
      if (!allNegatives[n]) allNegatives[n] = [];
      allNegatives[n].push(shortName);
    });
    (c.summary.opportunities || []).forEach((o) => {
      if (!allOpportunities[o]) allOpportunities[o] = [];
      allOpportunities[o].push(shortName);
    });
  });

  // Curated cross-client themes
  const themes = {
    positives: [
      { theme: "Fast payroll calculation & multi-user capability", clients: ["Merco", "Criogas", "Galdisa"] },
      { theme: "Integrated platform (payroll + SUA + timbrado)", clients: ["Criogas", "Galdisa", "Whirlpool", "Merco"] },
      { theme: "Fast regulatory updates", clients: ["Criogas"] },
      { theme: "User-friendly, intuitive interface", clients: ["Merco", "Criogas"] },
    ],
    negatives: [
      { theme: "Slow timbrado / confronta for large employee bases", clients: ["Merco", "Whirlpool"], severity: "high" },
      { theme: "Support quality inconsistency", clients: ["Merco", "Whirlpool", "Galdisa"], severity: "high" },
      { theme: "Bugs after system updates", clients: ["Criogas"], severity: "medium" },
      { theme: "SUA report format discrepancies", clients: ["Galdisa"], severity: "medium" },
      { theme: "Insufficient proactive communication", clients: ["Whirlpool", "Criogas"], severity: "medium" },
    ],
    opportunities: [
      { theme: "Performance optimization at scale", clients: ["Merco", "Whirlpool"], priority: "critical" },
      { theme: "SLA framework with urgency levels", clients: ["Merco"], priority: "high" },
      { theme: "Analytics & HR dashboards", clients: ["Merco"], priority: "high" },
      { theme: "API / integration layer", clients: ["Criogas", "Galdisa"], priority: "medium" },
      { theme: "HR/Talent module expansion", clients: ["Criogas"], priority: "medium" },
      { theme: "Potential full payroll migration", clients: ["Whirlpool"], priority: "low" },
    ],
  };

  // Filter themes to only show clients that match current filter
  const filterThemes = (items) => {
    if (productFilter === "all" && hostingFilter === "all") return items;
    return items
      .map((t) => ({
        ...t,
        clients: t.clients.filter((name) =>
          completed.some((c) => c.cliente.toLowerCase().includes(name.toLowerCase()))
        ),
      }))
      .filter((t) => t.clients.length > 0);
  };

  const sentiments = completed.reduce((acc, c) => {
    const s = c.summary.sentiment;
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const risks = completed.reduce((acc, c) => {
    const r = c.summary.riskLevel;
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Summary</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        Patterns across {completed.length} completed interviews
        {(productFilter !== "all" || hostingFilter !== "all") && " (filtered)"}
      </p>

      {/* Filters */}
      <div className="filters" style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginRight: 4 }}>Product:</span>
        {[
          ["all", "All"],
          ["Integral", "Integral"],
          ["Seguridad Social", "Seg. Social"],
        ].map(([key, label]) => (
          <button key={key} className={`filter-btn ${productFilter === key ? "active" : ""}`} onClick={() => setProductFilter(key)}>
            {label}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 12, marginRight: 4 }}>Hosting:</span>
        {[
          ["all", "All"],
          ["hosted", "Hosted"],
          ["not_hosted", "Not Hosted"],
        ].map(([key, label]) => (
          <button key={key} className={`filter-btn ${hostingFilter === key ? "active" : ""}`} onClick={() => setHostingFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {completed.length === 0 ? (
        <div className="no-data">
          <h3>No interviews match this filter</h3>
          <p>Try adjusting the product or hosting filters above.</p>
        </div>
      ) : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
            <div className="kpi-card">
              <div className="label">Positive Sentiment</div>
              <div className="value green">{sentiments.positive || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="label">Neutral Sentiment</div>
              <div className="value yellow">{sentiments.neutral || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="label">Negative Sentiment</div>
              <div className="value red">{sentiments.negative || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="label">High Risk</div>
              <div className="value red">{risks.high || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="label">Medium Risk</div>
              <div className="value yellow">{risks.medium || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="label">Low Risk</div>
              <div className="value green">{risks.low || 0}</div>
            </div>
          </div>

          {/* Per-client detail */}
          <div className="section">
            <div className="section-title">Interview Details</div>
            {completed.map((c) => (
              <div key={c.id} className="theme-card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <h3 style={{ marginBottom: 2 }}>{c.cliente}</h3>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.producto}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>&middot; Hosting: {c.hosting}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>&middot; {fmtUSD(c.billingUSD || 0)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className={`badge ${c.summary.sentiment}`}>{c.summary.sentiment}</span>
                    <span className={`badge ${c.summary.riskLevel}`}>{c.summary.riskLevel} risk</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, marginBottom: 10 }}>
                  {c.summary.executive}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", marginBottom: 4 }}>Positives</div>
                    {c.summary.positives.map((p, i) => (
                      <div key={i} style={{ fontSize: 11, color: "var(--text)", padding: "2px 0", borderBottom: "1px solid var(--border)" }}>{p}</div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--red)", marginBottom: 4 }}>Pain Points</div>
                    {c.summary.negatives.map((n, i) => (
                      <div key={i} style={{ fontSize: 11, color: "var(--text)", padding: "2px 0", borderBottom: "1px solid var(--border)" }}>{n}</div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--blue)", marginBottom: 4 }}>Opportunities</div>
                    {c.summary.opportunities.map((o, i) => (
                      <div key={i} style={{ fontSize: 11, color: "var(--text)", padding: "2px 0", borderBottom: "1px solid var(--border)" }}>{o}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cross-client themes */}
          <div className="section">
            <div className="section-title" style={{ color: "var(--green)" }}>Common Strengths</div>
            {filterThemes(themes.positives).map((t, i) => (
              <div key={i} className="theme-card">
                <h3>{t.theme}</h3>
                <div className="theme-clients">
                  {t.clients.map((c) => <span key={c} className="client-chip">{c}</span>)}
                </div>
              </div>
            ))}
          </div>

          <div className="section">
            <div className="section-title" style={{ color: "var(--red)" }}>Common Pain Points</div>
            {filterThemes(themes.negatives)
              .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]))
              .map((t, i) => (
                <div key={i} className="theme-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3>{t.theme}</h3>
                    <span className={`badge ${t.severity}`}>{t.severity}</span>
                  </div>
                  <div className="theme-clients">
                    {t.clients.map((c) => <span key={c} className="client-chip">{c}</span>)}
                  </div>
                </div>
              ))}
          </div>

          <div className="section">
            <div className="section-title" style={{ color: "var(--primary-lt)" }}>Opportunities & Product Gaps</div>
            {filterThemes(themes.opportunities)
              .sort((a, b) => ({ critical: 0, high: 1, medium: 2, low: 3 }[a.priority] - { critical: 0, high: 1, medium: 2, low: 3 }[b.priority]))
              .map((t, i) => (
                <div key={i} className="theme-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3>{t.theme}</h3>
                    <span className={`badge ${t.priority}`}>{t.priority}</span>
                  </div>
                  <div className="theme-clients">
                    {t.clients.map((c) => <span key={c} className="client-chip">{c}</span>)}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
