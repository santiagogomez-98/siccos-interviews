import React from "react";

export default function CrossAnalysis({ data }) {
  const completed = data.interviews.filter(
    (i) => i.interviewStatus === "completed" && i.interviewSummary
  );

  if (completed.length === 0) {
    return (
      <div className="no-data">
        <h3>No Completed Interviews</h3>
        <p>Cross-analysis will appear once interviews are completed.</p>
      </div>
    );
  }

  // Aggregate themes across interviews
  const themes = {
    positives: [
      {
        theme: "Fast payroll calculation & multi-user capability",
        description: "Multiple clients highlight speed of payroll calculation and ability for multiple users to work simultaneously as a major differentiator vs previous systems.",
        clients: ["Merco", "Criogas", "Galdisa"],
      },
      {
        theme: "Integrated platform (nómina + SUA + timbrado)",
        description: "The all-in-one approach was the #1 reason for choosing Siccos across all interviewed clients. Eliminates need for third-party timbrado or separate SUA tools.",
        clients: ["Criogas", "Galdisa", "Whirlpool", "Merco"],
      },
      {
        theme: "Fast regulatory updates",
        description: "Criogas specifically praised how quickly Siccos updates for regulatory changes (Nengin reform, CFDI 1.2), often before the mandatory deadline.",
        clients: ["Criogas"],
      },
      {
        theme: "User-friendly, intuitive interface",
        description: "Multiple clients describe the platform as 'amigable' (friendly) and easy to learn, especially compared to legacy payroll systems.",
        clients: ["Merco", "Criogas"],
      },
    ],
    negatives: [
      {
        theme: "Slow timbrado / confronta for large employee bases",
        description: "Critical pain point: Merco leaves timbrado running overnight for 4,300 employees. Whirlpool's confronta takes 1.5-2 hours for 3,300 employees. Performance degrades significantly at scale.",
        clients: ["Merco", "Whirlpool"],
        severity: "high",
      },
      {
        theme: "Support quality inconsistency",
        description: "Advisor rotation during incidents (re-explaining problems), long idle sessions (4+ hours), and perceived lack of expertise. Improved after management change but still an issue.",
        clients: ["Merco", "Whirlpool", "Galdisa"],
        severity: "high",
      },
      {
        theme: "Bugs after system updates",
        description: "Criogas experienced calculation errors in January after updates. Vacation calculation bug affected all employees. No root cause explanation provided.",
        clients: ["Criogas"],
        severity: "medium",
      },
      {
        theme: "SUA report format discrepancies",
        description: "Galdisa's clients flagged that Siccos SUA reports don't match official IMSS format, creating trust issues with end clients.",
        clients: ["Galdisa"],
        severity: "medium",
      },
      {
        theme: "Insufficient proactive communication",
        description: "Whirlpool receives no update notifications. Multiple clients want better alerts when regulatory changes or platform updates are deployed.",
        clients: ["Whirlpool", "Criogas"],
        severity: "medium",
      },
    ],
    opportunities: [
      {
        theme: "Performance optimization at scale",
        description: "Timbrado and confronta speed is the single biggest technical gap. Solving this directly impacts retention for the largest, highest-revenue clients.",
        clients: ["Merco", "Whirlpool"],
        priority: "critical",
      },
      {
        theme: "SLA framework with urgency levels",
        description: "No formal SLA exists. Merco proposed a tiered system (critical/urgent/normal) with defined response times. This would professionalize the service layer significantly.",
        clients: ["Merco"],
        priority: "high",
      },
      {
        theme: "Analytics & HR dashboards",
        description: "Clients want trend analysis (overtime, turnover, payroll cost comparisons) directly in the platform instead of exporting to Excel. SAT reconciliation tool also requested.",
        clients: ["Merco"],
        priority: "high",
      },
      {
        theme: "API / integration layer",
        description: "Criogas needs APIs to connect Siccos employee catalog with document management and other internal systems. Galdisa needs BOOK→Siccos interface completed.",
        clients: ["Criogas", "Galdisa"],
        priority: "medium",
      },
      {
        theme: "HR/Talent module expansion",
        description: "Current HR modules (recruitment, training, contracts) are too basic. Criogas and others use separate systems for recruitment (ATS), vacations, and talent development.",
        clients: ["Criogas"],
        priority: "medium",
      },
      {
        theme: "Potential full nómina migration",
        description: "Whirlpool currently uses SAP for payroll and Siccos only for social security. There's an opening to migrate their full payroll to Siccos if evaluated.",
        clients: ["Whirlpool"],
        priority: "low",
      },
    ],
  };

  // Sentiment distribution
  const sentiments = completed.reduce(
    (acc, c) => {
      const s = c.interviewSummary.sentiment;
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {}
  );

  const risks = completed.reduce(
    (acc, c) => {
      const r = c.interviewSummary.riskLevel;
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f0f6fc", marginBottom: 4 }}>
        Cross-Client Analysis
      </h2>
      <p style={{ fontSize: 13, color: "#8b949e", marginBottom: 24 }}>
        Patterns across {completed.length} completed interviews
      </p>

      {/* Summary KPIs */}
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

      {/* Common Positives */}
      <div className="section">
        <div className="section-title" style={{ color: "#3fb950" }}>
          Common Strengths
        </div>
        {themes.positives.map((t, i) => (
          <div key={i} className="theme-card">
            <h3>{t.theme}</h3>
            <p style={{ fontSize: 13, color: "#c9d1d9", marginBottom: 8 }}>
              {t.description}
            </p>
            <div className="theme-clients">
              {t.clients.map((c) => (
                <span key={c} className="client-chip">{c}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Common Pain Points */}
      <div className="section">
        <div className="section-title" style={{ color: "#f85149" }}>
          Common Pain Points
        </div>
        {themes.negatives
          .sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.severity] - order[b.severity];
          })
          .map((t, i) => (
            <div key={i} className="theme-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>{t.theme}</h3>
                <span className={`badge ${t.severity}`}>{t.severity} severity</span>
              </div>
              <p style={{ fontSize: 13, color: "#c9d1d9", marginBottom: 8 }}>
                {t.description}
              </p>
              <div className="theme-clients">
                {t.clients.map((c) => (
                  <span key={c} className="client-chip">{c}</span>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Opportunities */}
      <div className="section">
        <div className="section-title" style={{ color: "#58a6ff" }}>
          Opportunities & Product Gaps
        </div>
        {themes.opportunities
          .sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return order[a.priority] - order[b.priority];
          })
          .map((t, i) => (
            <div key={i} className="theme-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>{t.theme}</h3>
                <span
                  className="badge"
                  style={{
                    background:
                      t.priority === "critical"
                        ? "#2d1b1b"
                        : t.priority === "high"
                        ? "#1c1d0f"
                        : "#1a1a2e",
                    color:
                      t.priority === "critical"
                        ? "#f85149"
                        : t.priority === "high"
                        ? "#d29922"
                        : "#a5d8ff",
                  }}
                >
                  {t.priority} priority
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#c9d1d9", marginBottom: 8 }}>
                {t.description}
              </p>
              <div className="theme-clients">
                {t.clients.map((c) => (
                  <span key={c} className="client-chip">{c}</span>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
