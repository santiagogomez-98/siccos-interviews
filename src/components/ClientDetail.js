import React from "react";

const formatCurrency = (n) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const daysUntil = (d) => {
  if (!d) return Infinity;
  return Math.ceil(
    (new Date(d + "T00:00:00") - new Date("2026-03-10T00:00:00")) /
      (1000 * 60 * 60 * 24)
  );
};

const statusLabel = {
  completed: "Completed",
  scheduled: "Scheduled",
  scheduling: "Scheduling",
  not_contacted: "Not Contacted",
};

export default function ClientDetail({ client, onBack }) {
  if (!client) return null;
  const s = client.interviewSummary;
  const days = daysUntil(client.vigencia);

  return (
    <div>
      <div className="detail-header">
        <div>
          <button className="back-btn" onClick={onBack}>
            &larr; Back to list
          </button>
          <h2 style={{ marginTop: 12 }}>{client.cliente}</h2>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <span className={`badge ${client.interviewStatus}`}>
              {statusLabel[client.interviewStatus]}
            </span>
            {client.crehanaShared && (
              <span className="badge crehana">Crehana Shared</span>
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
          <div className="meta-label">Billing 2025</div>
          <div className="meta-value">{formatCurrency(client.facturacion2025)}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Renewal Date</div>
          <div
            className="meta-value"
            style={{ color: days <= 30 ? "#f85149" : days <= 90 ? "#d29922" : "#f0f6fc" }}
          >
            {formatDate(client.vigencia)}
            {days <= 90 && <span style={{ fontSize: 13, marginLeft: 6 }}>({days} days)</span>}
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
            <div className="meta-label">Interview Date</div>
            <div className="meta-value">
              {formatDate(client.fechaReunion)} {client.horario}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {client.notas && (
        <div className="summary-box" style={{ borderLeft: "3px solid #d29922" }}>
          <div style={{ fontSize: 11, color: "#8b949e", textTransform: "uppercase", marginBottom: 4 }}>
            Notes
          </div>
          <p>{client.notas}</p>
        </div>
      )}

      {/* Interview summary */}
      {s ? (
        <>
          <div className="summary-box">
            <div
              style={{
                fontSize: 11,
                color: "#8b949e",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Executive Summary
            </div>
            <p>{s.summary}</p>
          </div>

          {/* Risk note */}
          {s.riskNote && (
            <div
              className="summary-box"
              style={{
                borderLeft: `3px solid ${
                  s.riskLevel === "high"
                    ? "#f85149"
                    : s.riskLevel === "medium"
                    ? "#d29922"
                    : "#3fb950"
                }`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#8b949e",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Risk Assessment
              </div>
              <p>{s.riskNote}</p>
            </div>
          )}

          {/* Positives / Negatives / Opportunities */}
          <div className="insight-grid">
            <div className="insight-card pos">
              <h3 className="positive">Positives ({s.positives.length})</h3>
              <ul>
                {s.positives.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="insight-card neg">
              <h3 className="negative">Pain Points ({s.negatives.length})</h3>
              <ul>
                {s.negatives.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="insight-card opp">
              <h3 className="opportunity">Opportunities ({s.opportunities.length})</h3>
              <ul>
                {s.opportunities.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="no-data">
          <h3>Interview Not Yet Completed</h3>
          <p>
            {client.interviewStatus === "scheduled"
              ? `Scheduled for ${formatDate(client.fechaReunion)} at ${client.horario}`
              : client.interviewStatus === "scheduling"
              ? "Awaiting confirmation of availability"
              : "Client has not been contacted yet"}
          </p>
        </div>
      )}
    </div>
  );
}
