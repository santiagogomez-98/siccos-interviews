import React from "react";
import jsPDF from "jspdf";

const fmtUSD = (n) => "$" + Math.round(n).toLocaleString("en-US");
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};
const daysUntil = (d) => {
  if (!d) return Infinity;
  return Math.ceil((new Date(d + "T00:00:00") - new Date("2026-03-10T00:00:00")) / 86400000);
};

const statusLabel = {
  completed: "Completed", scheduled: "Scheduled",
  scheduling: "Scheduling", not_contacted: "Not Contacted",
};

const generatePDF = (client) => {
  const s = client.summary;
  if (!s) return;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 190;
  let y = 20;
  const itemText = (item) => typeof item === "string" ? item : item.text;
  const weightLabel = (item) => typeof item === "string" ? "" : ` [${item.w}]`;

  const addLine = (text, size, style, color) => {
    doc.setFontSize(size || 11);
    doc.setFont("helvetica", style || "normal");
    doc.setTextColor(...(color || [17, 24, 39]));
    const lines = doc.splitTextToSize(text, W);
    if (y + lines.length * (size || 11) * 0.45 > 275) { doc.addPage(); y = 20; }
    doc.text(lines, 10, y);
    y += lines.length * (size || 11) * 0.45 + 2;
  };

  const addBullets = (items, color) => {
    items.forEach((item) => {
      const txt = `• ${itemText(item)}${weightLabel(item)}`;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...(color || [17, 24, 39]));
      const lines = doc.splitTextToSize(txt, W - 5);
      if (y + lines.length * 4 > 275) { doc.addPage(); y = 20; }
      doc.text(lines, 13, y);
      y += lines.length * 4 + 1;
    });
    y += 3;
  };

  // Header
  addLine(client.cliente, 18, "bold");
  addLine(`${client.id} · ${client.producto} · ARR: ${fmtUSD(client.billingUSD || 0)} · Renewal: ${fmtDate(client.vigencia)}`, 10, "normal", [107, 114, 128]);
  if (client.keyContact) addLine(`Contact: ${client.keyContact}`, 10, "normal", [107, 114, 128]);
  y += 4;

  // Badges
  addLine(`Sentiment: ${s.sentiment}  |  Risk: ${s.riskLevel}`, 11, "bold");
  y += 2;

  // Executive Summary
  addLine("EXECUTIVE SUMMARY", 11, "bold", [79, 70, 229]);
  addLine(s.executive, 10);
  y += 3;

  // Risk Assessment
  if (s.riskNote) {
    addLine("RISK ASSESSMENT", 11, "bold", [220, 38, 38]);
    addLine(s.riskNote, 10);
    y += 3;
  }

  // Churn & Retention
  if (s.churnSignals?.length) {
    addLine("CHURN SIGNALS", 10, "bold", [220, 38, 38]);
    addBullets(s.churnSignals, [220, 38, 38]);
  }
  if (s.retentionSignals?.length) {
    addLine("RETENTION SIGNALS", 10, "bold", [5, 150, 105]);
    addBullets(s.retentionSignals, [5, 150, 105]);
  }

  // Positives
  addLine(`POSITIVES (${s.positives.length})`, 11, "bold", [5, 150, 105]);
  addBullets(s.positives, [17, 24, 39]);

  // Negatives
  addLine(`PAIN POINTS (${s.negatives.length})`, 11, "bold", [220, 38, 38]);
  addBullets(s.negatives, [17, 24, 39]);

  // Opportunities
  addLine(`OPPORTUNITIES (${s.opportunities.length})`, 11, "bold", [37, 99, 235]);
  addBullets(s.opportunities, [17, 24, 39]);

  // Footer
  y += 5;
  addLine(`Generated: ${new Date().toLocaleDateString("en-US")} · Siccos M&A Due Diligence`, 8, "normal", [156, 163, 175]);

  const fileName = client.cliente.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_") + "_Interview.pdf";
  doc.save(fileName);
};

export default function ClientDetail({ client, onBack }) {
  if (!client) return null;
  const s = client.summary;
  const days = daysUntil(client.vigencia);

  return (
    <div>
      <div className="detail-header">
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="back-btn" onClick={onBack}>&larr; Back</button>
            {s && <button className="back-btn" onClick={() => generatePDF(client)} style={{ background: "var(--primary)", color: "#fff", border: "none" }}>↓ Download PDF</button>}
          </div>
          <h2 style={{ marginTop: 12 }}>{client.cliente}</h2>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {client.interviewStatus && (
              <span className={`badge ${client.interviewStatus}`}>
                {statusLabel[client.interviewStatus]}
              </span>
            )}
            {s && (
              <>
                <span className={`badge ${s.sentiment}`}>{s.sentiment} sentiment</span>
                <span className={`badge ${s.riskLevel}`}>{s.riskLevel} risk</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Meta cards */}
      <div className="detail-meta">
        <div className="meta-item">
          <div className="meta-label">Contract</div>
          <div className="meta-value">{client.id}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">ARR (USD)</div>
          <div className="meta-value">{fmtUSD(client.billingUSD || 0)}</div>
        </div>
        {client.billingMXN > 0 && (
          <div className="meta-item">
            <div className="meta-label">ARR (MXN)</div>
            <div className="meta-value">${client.billingMXN.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
          </div>
        )}
        <div className="meta-item">
          <div className="meta-label">Renewal</div>
          <div className="meta-value" style={{ color: days <= 30 ? "var(--red)" : days <= 90 ? "var(--yellow)" : "var(--text)" }}>
            {fmtDate(client.vigencia)}
            {days <= 90 && days >= 0 && <span style={{ fontSize: 13, marginLeft: 6 }}>({days}d)</span>}
          </div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Product</div>
          <div className="meta-value">{client.producto}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Hosting</div>
          <div className="meta-value">{client.hosting}</div>
        </div>
        {client.keyContact && (
          <div className="meta-item">
            <div className="meta-label">Key Contact</div>
            <div className="meta-value">{client.keyContact}</div>
          </div>
        )}
        {client.fechaReunion && (
          <div className="meta-item">
            <div className="meta-label">Interview</div>
            <div className="meta-value">{fmtDate(client.fechaReunion)} {client.horario}</div>
          </div>
        )}
      </div>

      {/* Notes */}
      {client.notas && (
        <div className="summary-box" style={{ borderLeft: "3px solid var(--yellow)" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
          <p>{client.notas}</p>
        </div>
      )}

      {/* Observations from full client base */}
      {client.observaciones && !client.notas && (
        <div className="summary-box" style={{ borderLeft: "3px solid var(--primary-lt)" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Observations</div>
          <p>{client.observaciones}</p>
        </div>
      )}

      {/* Interview summary */}
      {s ? (
        <>
          <div className="summary-box">
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
              Executive Summary
            </div>
            <p>{s.executive}</p>
          </div>

          {s.riskNote && (
            <div className="summary-box" style={{
              borderLeft: `3px solid ${s.riskLevel === "high" ? "var(--red)" : s.riskLevel === "medium" ? "var(--yellow)" : "var(--green)"}`,
            }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                Risk Assessment
              </div>
              <p>{s.riskNote}</p>
            </div>
          )}

          {/* Churn & Retention Signals */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            {s.churnSignals?.length > 0 && (
              <div className="signal-card" style={{ borderLeft: "3px solid var(--red)" }}>
                <h4 style={{ color: "var(--red)" }}>Churn Signals</h4>
                <ul className="signal-list churn">
                  {s.churnSignals.map((sig, i) => <li key={i}>{sig}</li>)}
                </ul>
              </div>
            )}
            {s.retentionSignals?.length > 0 && (
              <div className="signal-card" style={{ borderLeft: "3px solid var(--green)" }}>
                <h4 style={{ color: "var(--green)" }}>Retention Signals</h4>
                <ul className="signal-list retention">
                  {s.retentionSignals.map((sig, i) => <li key={i}>{sig}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Positives / Negatives / Opportunities */}
          <div className="insight-grid">
            <div className="insight-card pos">
              <h3 className="positive">Positives ({s.positives.length})</h3>
              <ul>
                {s.positives.map((item, i) => <li key={i}>{typeof item === "string" ? item : item.text}</li>)}
              </ul>
            </div>
            <div className="insight-card neg">
              <h3 className="negative">Pain Points ({s.negatives.length})</h3>
              <ul>
                {s.negatives.map((item, i) => <li key={i}>{typeof item === "string" ? item : item.text}</li>)}
              </ul>
            </div>
            <div className="insight-card opp">
              <h3 className="opportunity">Opportunities ({s.opportunities.length})</h3>
              <ul>
                {s.opportunities.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </>
      ) : client.interviewStatus ? (
        <div className="no-data">
          <h3>Interview Not Yet Completed</h3>
          <p>
            {client.interviewStatus === "scheduled"
              ? `Scheduled for ${fmtDate(client.fechaReunion)} at ${client.horario}`
              : client.interviewStatus === "scheduling"
              ? "Awaiting confirmation of availability"
              : "Client has not been contacted yet"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
