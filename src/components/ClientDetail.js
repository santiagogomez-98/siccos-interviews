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

const WEIGHT_ORDER = { blocker: 0, core: 1, support: 2, minor: 3 };
const sortByWeight = (items) => [...items].sort((a, b) => (WEIGHT_ORDER[a.w] ?? 3) - (WEIGHT_ORDER[b.w] ?? 3));
const txt = (item) => typeof item === "string" ? item : item.text;

const generatePDF = (client) => {
  const s = client.summary;
  if (!s) return;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 175;
  const LM = 15;
  let y = 20;

  const checkPage = (needed) => { if (y + needed > 275) { doc.addPage(); y = 20; } };

  const addText = (text, size, style, color, indent) => {
    const x = indent || LM;
    doc.setFontSize(size || 10); doc.setFont("helvetica", style || "normal"); doc.setTextColor(...(color || [33, 33, 33]));
    const lines = doc.splitTextToSize(text, W - (x - LM));
    checkPage(lines.length * (size || 10) * 0.42);
    doc.text(lines, x, y);
    y += lines.length * (size || 10) * 0.42 + 1.5;
  };

  const addSection = (title, color) => {
    y += 5;
    doc.setDrawColor(...color); doc.setLineWidth(0.6);
    checkPage(10);
    doc.line(LM, y, LM + 40, y);
    y += 5;
    addText(title, 11, "bold", color);
    y += 1;
  };

  const addBullet = (text, color) => {
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...(color || [33, 33, 33]));
    const lines = doc.splitTextToSize(text, W - 8);
    checkPage(lines.length * 3.8);
    doc.text("•", LM + 2, y);
    doc.text(lines, LM + 7, y);
    y += lines.length * 3.8 + 1;
  };

  // ─── HEADER ───
  doc.setFillColor(79, 70, 229); doc.rect(0, 0, 210, 36, "F");
  doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text(client.cliente, LM, 16);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`Customer Interview Brief  ·  Siccos M&A Due Diligence`, LM, 24);
  doc.setFontSize(9);
  doc.text(`${fmtDate(client.fechaReunion || "")}  ·  Contact: ${client.keyContact || "N/A"}`, LM, 30);
  y = 44;

  // ─── KEY FACTS ───
  const riskColors = { high: [220, 38, 38], medium: [217, 119, 6], low: [5, 150, 105] };
  const sentColors = { positive: [5, 150, 105], neutral: [217, 119, 6], negative: [220, 38, 38] };
  const facts = [
    ["Contract", client.id],
    ["Product", client.producto],
    ["ARR (USD)", fmtUSD(client.billingUSD || 0)],
    ["Renewal", `${fmtDate(client.vigencia)} (${daysUntil(client.vigencia)}d)`],
    ["Hosting", client.hosting || "N/A"],
  ];
  doc.setFillColor(245, 245, 250); doc.roundedRect(LM, y - 4, W, 20, 2, 2, "F");
  let fx = LM + 4;
  facts.forEach(([label, val]) => {
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 140);
    doc.text(label.toUpperCase(), fx, y + 2);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(33, 33, 33);
    doc.text(val, fx, y + 8);
    fx += 35;
  });
  y += 22;

  // Sentiment & Risk badges
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.setTextColor(...(sentColors[s.sentiment] || [33, 33, 33]));
  doc.text(`Sentiment: ${s.sentiment.toUpperCase()}`, LM, y);
  doc.setTextColor(...(riskColors[s.riskLevel] || [33, 33, 33]));
  doc.text(`Risk: ${s.riskLevel.toUpperCase()}`, LM + 55, y);
  y += 4;

  // ─── EXECUTIVE SUMMARY ───
  addSection("Executive Summary", [79, 70, 229]);
  addText(s.executive, 10, "normal", [50, 50, 60]);

  // ─── RISK ASSESSMENT ───
  if (s.riskNote) {
    addSection("Risk Assessment", riskColors[s.riskLevel] || [220, 38, 38]);
    addText(s.riskNote, 10, "normal", [50, 50, 60]);
    if (s.churnSignals?.length) {
      y += 2;
      addText("Churn Signals:", 9, "bold", [220, 38, 38]);
      s.churnSignals.forEach((sig) => addBullet(sig, [150, 40, 40]));
    }
    if (s.retentionSignals?.length) {
      y += 2;
      addText("Retention Signals:", 9, "bold", [5, 150, 105]);
      s.retentionSignals.forEach((sig) => addBullet(sig, [5, 120, 80]));
    }
  }

  // ─── KEY STRENGTHS ───
  addSection(`Key Strengths (${s.positives.length})`, [5, 150, 105]);
  sortByWeight(s.positives).forEach((item) => addBullet(txt(item), [33, 33, 33]));

  // ─── PAIN POINTS ───
  addSection(`Pain Points (${s.negatives.length})`, [220, 38, 38]);
  sortByWeight(s.negatives).forEach((item) => {
    const isCritical = typeof item !== "string" && item.w === "blocker";
    addBullet(txt(item), isCritical ? [180, 20, 20] : [33, 33, 33]);
  });

  // ─── OPPORTUNITIES ───
  addSection(`Opportunities (${s.opportunities.length})`, [37, 99, 235]);
  s.opportunities.forEach((item) => addBullet(txt(item), [33, 33, 33]));

  // ─── FOOTER ───
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(160, 160, 170);
    doc.text(`Siccos M&A Due Diligence  ·  Confidential  ·  ${new Date().toLocaleDateString("en-US")}`, LM, 290);
    doc.text(`Page ${i} of ${pages}`, 185, 290);
  }

  const fileName = client.cliente.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_") + "_Brief.pdf";
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
            {s && <button className="back-btn" onClick={() => generatePDF(client)} style={{ background: "var(--primary)", color: "#fff", border: "none" }}>↓ Interview Brief</button>}
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
