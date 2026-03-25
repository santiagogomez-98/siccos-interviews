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
      const t = typeof p === "string" ? p : p.text;
      if (!allPositives[t]) allPositives[t] = [];
      allPositives[t].push(shortName);
    });
    (c.summary.negatives || []).forEach((n) => {
      const t = typeof n === "string" ? n : n.text;
      if (!allNegatives[t]) allNegatives[t] = [];
      allNegatives[t].push(shortName);
    });
    (c.summary.opportunities || []).forEach((o) => {
      if (!allOpportunities[o]) allOpportunities[o] = [];
      allOpportunities[o].push(shortName);
    });
  });

  // Curated cross-client themes (11 interviews)
  const themes = {
    positives: [
      { theme: "Integrated platform — all-in-one (payroll + SUA + timbrado)", clients: ["Criogas", "Galdisa", "Merco", "Corp. Admin. Sur", "Milano", "Shriners", "ITESM"] },
      { theme: "Fast, accurate calculations — confrontas confiables", clients: ["Merco", "Criogas", "Galdisa", "Corp. Admin. Sur", "Bimbo", "CEMEX", "Shriners"] },
      { theme: "Centralization at scale — replaces 10-15 people with 3", clients: ["CEMEX", "Bimbo", "Corp. Admin. Sur", "ITESM"] },
      { theme: "Long-term loyalty — customers advocate and fight to keep Siccos", clients: ["Shriners (22yr)", "CEMEX (18yr)", "Corp. Admin. Sur (7yr)"] },
      { theme: "Support improved (Michelle, Cristian highly rated)", clients: ["Merco", "Galdisa", "Criogas", "Bimbo", "CEMEX", "ITESM", "Liverpool"] },
      { theme: "Automatic regulatory updates without manual intervention", clients: ["Criogas", "Corp. Admin. Sur", "Milano", "Shriners"] },
    ],
    negatives: [
      { theme: "Catastrophic performance at scale — days to process for largest clients", clients: ["Liverpool", "CEMEX", "Merco", "Whirlpool", "Milano"], severity: "critical" },
      { theme: "Cédulas don't match IMSS format — massive monthly rework", clients: ["Bimbo", "CEMEX", "Whirlpool", "Galdisa"], severity: "critical" },
      { theme: "No SIPARE (línea de captura) — disco payments are risky", clients: ["Bimbo", "CEMEX"], severity: "critical" },
      { theme: "Confrontas incomplete / limited — can't fully validate payments", clients: ["Liverpool", "ITESM", "Corp. Admin. Sur"], severity: "high" },
      { theme: "Bugs after regulatory updates (UMA, subsidio, vacaciones)", clients: ["Criogas", "Corp. Admin. Sur", "ITESM"], severity: "high" },
      { theme: "Support historically inconsistent — advisor rotation", clients: ["Merco", "Whirlpool", "Galdisa", "Bimbo", "Liverpool"], severity: "high" },
      { theme: "Lack of client training & knowledge transfer", clients: ["Shriners", "Liverpool"], severity: "medium" },
    ],
    opportunities: [
      { theme: "Performance optimization — existential for largest clients", clients: ["Liverpool", "CEMEX", "Merco", "Whirlpool", "Milano"], priority: "critical" },
      { theme: "SIPARE integration — eliminate disco risk", clients: ["Bimbo", "CEMEX"], priority: "critical" },
      { theme: "Official IMSS format cédulas — eliminate monthly SUA rework", clients: ["Bimbo", "CEMEX", "Whirlpool", "Galdisa"], priority: "critical" },
      { theme: "API / integration layer (Workday, SuccessFactors, cloud)", clients: ["Shriners", "ITESM", "Criogas", "Galdisa", "CEMEX"], priority: "high" },
      { theme: "Robust confrontas — full panorama incl. pensión, invalidez, prima de riesgo", clients: ["ITESM", "Liverpool", "Corp. Admin. Sur"], priority: "high" },
      { theme: "AI-powered automation & modern tech adoption", clients: ["ITESM"], priority: "medium" },
      { theme: "Structured account reviews & proactive communications", clients: ["Liverpool", "ITESM", "Bimbo", "CEMEX"], priority: "medium" },
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
                      <div key={i} style={{ fontSize: 11, color: "var(--text)", padding: "2px 0", borderBottom: "1px solid var(--border)" }}>{typeof p === "string" ? p : p.text}</div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--red)", marginBottom: 4 }}>Pain Points</div>
                    {c.summary.negatives.map((n, i) => (
                      <div key={i} style={{ fontSize: 11, color: "var(--text)", padding: "2px 0", borderBottom: "1px solid var(--border)" }}>{typeof n === "string" ? n : n.text}</div>
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
