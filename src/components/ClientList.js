import React, { useState } from "react";

const formatCurrency = (n) => "$" + (n / 1000000).toFixed(1) + "M";
const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
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

export default function ClientList({ interviews, onSelectClient }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("billing");

  let filtered = interviews.filter((c) => {
    const matchSearch = c.cliente.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      c.interviewStatus === filter ||
      (filter === "crehana" && c.crehanaShared);
    return matchSearch && matchFilter;
  });

  filtered.sort((a, b) => {
    if (sort === "billing") return b.facturacion2025 - a.facturacion2025;
    if (sort === "renewal") return daysUntil(a.vigencia) - daysUntil(b.vigencia);
    if (sort === "name") return a.cliente.localeCompare(b.cliente);
    return 0;
  });

  const totalBilling = filtered.reduce((s, c) => s + c.facturacion2025, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f0f6fc" }}>
            Interview Target Base
          </h2>
          <div style={{ fontSize: 13, color: "#8b949e", marginTop: 2 }}>
            {filtered.length} clients &middot; {formatCurrency(totalBilling)} combined billing
          </div>
        </div>
        <input
          className="search-input"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filters">
        {[
          ["all", "All"],
          ["completed", "Completed"],
          ["scheduled", "Scheduled"],
          ["scheduling", "Scheduling"],
          ["not_contacted", "Not Contacted"],
          ["crehana", "Crehana Shared"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`filter-btn ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {[
            ["billing", "$ Billing"],
            ["renewal", "Renewal"],
            ["name", "Name"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`filter-btn ${sort === key ? "active" : ""}`}
              onClick={() => setSort(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Interview Status</th>
              <th>Product</th>
              <th>Billing 2025</th>
              <th>Renewal</th>
              <th>Hosting</th>
              <th>Crehana</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="clickable"
                onClick={() => onSelectClient(c)}
              >
                <td>
                  <div style={{ fontWeight: 500 }}>{c.cliente}</div>
                  <div style={{ fontSize: 11, color: "#8b949e" }}>{c.id}</div>
                </td>
                <td>
                  <span className={`badge ${c.interviewStatus}`}>
                    {statusLabel[c.interviewStatus]}
                  </span>
                </td>
                <td style={{ fontSize: 13 }}>{c.producto}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(c.facturacion2025)}</td>
                <td>
                  <span
                    style={{
                      color:
                        daysUntil(c.vigencia) <= 30
                          ? "#f85149"
                          : daysUntil(c.vigencia) <= 90
                          ? "#d29922"
                          : "#8b949e",
                      fontSize: 13,
                    }}
                  >
                    {formatDate(c.vigencia)}
                    {daysUntil(c.vigencia) <= 90 && (
                      <span style={{ fontSize: 11, marginLeft: 4 }}>
                        ({daysUntil(c.vigencia)}d)
                      </span>
                    )}
                  </span>
                </td>
                <td style={{ fontSize: 13 }}>{c.hosting}</td>
                <td>
                  {c.crehanaShared && <span className="badge crehana">Shared</span>}
                </td>
                <td>
                  {c.interviewSummary && (
                    <span className={`badge ${c.interviewSummary.riskLevel}`}>
                      {c.interviewSummary.riskLevel}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
