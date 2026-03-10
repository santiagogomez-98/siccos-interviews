import React from "react";

const formatCurrency = (n) =>
  "$" + (n / 1000000).toFixed(1) + "M";

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const daysUntil = (d) => {
  if (!d) return Infinity;
  const diff = new Date(d + "T00:00:00") - new Date("2026-03-10T00:00:00");
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const statusLabel = {
  completed: "Completed",
  scheduled: "Scheduled",
  scheduling: "Scheduling",
  not_contacted: "Not Contacted",
};

export default function Dashboard({ data, onSelectClient }) {
  const { interviews, baseStats } = data;

  const completed = interviews.filter((i) => i.interviewStatus === "completed");
  const scheduled = interviews.filter((i) => i.interviewStatus === "scheduled");
  const scheduling = interviews.filter((i) => i.interviewStatus === "scheduling");
  const notContacted = interviews.filter((i) => i.interviewStatus === "not_contacted");

  const completedBilling = completed.reduce((s, c) => s + c.facturacion2025, 0);
  const targetBilling = interviews.reduce((s, c) => s + c.facturacion2025, 0);

  const urgentRenewals = interviews
    .filter((i) => daysUntil(i.vigencia) <= 90 && daysUntil(i.vigencia) >= 0)
    .sort((a, b) => daysUntil(a.vigencia) - daysUntil(b.vigencia));

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="label">Interviews Completed</div>
          <div className="value green">{completed.length}</div>
          <div className="sub">of {interviews.length} target clients</div>
          <div className="progress-bar">
            <div
              className="progress-fill green"
              style={{ width: `${(completed.length / interviews.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="kpi-card">
          <div className="label">Revenue Covered</div>
          <div className="value blue">{formatCurrency(completedBilling)}</div>
          <div className="sub">
            {((completedBilling / targetBilling) * 100).toFixed(0)}% of interview target base
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill blue"
              style={{ width: `${(completedBilling / targetBilling) * 100}%` }}
            />
          </div>
        </div>
        <div className="kpi-card">
          <div className="label">Total Client Base</div>
          <div className="value">{baseStats.totalClients}</div>
          <div className="sub">
            {baseStats.sharedHosting} shared hosting (Crehana)
          </div>
        </div>
        <div className="kpi-card">
          <div className="label">Total Billing 2025</div>
          <div className="value">{formatCurrency(baseStats.totalBilling2025)}</div>
          <div className="sub">{baseStats.activeClients} active contracts</div>
        </div>
        <div className="kpi-card">
          <div className="label">Urgent Renewals (90d)</div>
          <div className="value red">{urgentRenewals.length}</div>
          <div className="sub">from interview targets</div>
        </div>
      </div>

      <div className="two-col">
        {/* Interview Pipeline */}
        <div className="section">
          <div className="section-title">Interview Pipeline</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Contact</th>
                  <th>Billing 2025</th>
                  <th>Renewal</th>
                  <th>Crehana</th>
                </tr>
              </thead>
              <tbody>
                {interviews
                  .sort((a, b) => {
                    const order = { completed: 0, scheduled: 1, scheduling: 2, not_contacted: 3 };
                    return order[a.interviewStatus] - order[b.interviewStatus];
                  })
                  .map((client) => (
                    <tr
                      key={client.id}
                      className="clickable"
                      onClick={() => onSelectClient(client)}
                    >
                      <td style={{ fontWeight: 500 }}>{client.cliente}</td>
                      <td>
                        <span className={`badge ${client.interviewStatus}`}>
                          {statusLabel[client.interviewStatus]}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {client.fechaReunion
                          ? `${formatDate(client.fechaReunion)} ${client.horario || ""}`
                          : "—"}
                      </td>
                      <td style={{ fontSize: 13 }}>{client.keyContact || "—"}</td>
                      <td style={{ fontWeight: 600 }}>
                        {formatCurrency(client.facturacion2025)}
                      </td>
                      <td>
                        <span
                          style={{
                            color:
                              daysUntil(client.vigencia) <= 30
                                ? "#f85149"
                                : daysUntil(client.vigencia) <= 90
                                ? "#d29922"
                                : "#8b949e",
                            fontSize: 13,
                          }}
                        >
                          {formatDate(client.vigencia)}
                          {daysUntil(client.vigencia) <= 90 && (
                            <span style={{ fontSize: 11, marginLeft: 4 }}>
                              ({daysUntil(client.vigencia)}d)
                            </span>
                          )}
                        </span>
                      </td>
                      <td>
                        {client.crehanaShared && (
                          <span className="badge crehana">Shared</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Sentiment summary */}
          <div className="section">
            <div className="section-title">Interview Sentiment</div>
            {completed.map((c) => (
              <div
                key={c.id}
                className="renewal-item clickable"
                onClick={() => onSelectClient(c)}
                style={{ cursor: "pointer" }}
              >
                <span className={`badge ${c.interviewSummary?.sentiment}`}>
                  {c.interviewSummary?.sentiment}
                </span>
                <span className="renewal-name">{c.cliente}</span>
                <span className={`badge ${c.interviewSummary?.riskLevel}`}>
                  {c.interviewSummary?.riskLevel} risk
                </span>
              </div>
            ))}
            {completed.length === 0 && (
              <div style={{ color: "#8b949e", fontSize: 13 }}>
                No interviews completed yet
              </div>
            )}
          </div>

          {/* Urgent renewals */}
          <div className="section">
            <div className="section-title">Upcoming Renewals</div>
            <div
              style={{
                background: "#161b22",
                border: "1px solid #21262d",
                borderRadius: 12,
                padding: 16,
              }}
            >
              {urgentRenewals.map((c) => (
                <div key={c.id} className="renewal-item">
                  <span
                    className="renewal-date"
                    style={{
                      color:
                        daysUntil(c.vigencia) <= 30 ? "#f85149" : "#d29922",
                    }}
                  >
                    {formatDate(c.vigencia)}
                  </span>
                  <span className="renewal-name">{c.cliente}</span>
                  <span className="renewal-amount">
                    {formatCurrency(c.facturacion2025)}
                  </span>
                </div>
              ))}
              {urgentRenewals.length === 0 && (
                <div style={{ color: "#8b949e", fontSize: 13 }}>
                  No renewals in the next 90 days
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
