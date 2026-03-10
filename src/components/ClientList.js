import React, { useState } from "react";

const fmtUSD = (n) => "$" + Math.round(n / 1000).toLocaleString("en-US") + "K";
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const daysUntil = (d) => {
  if (!d) return Infinity;
  return Math.ceil((new Date(d + "T00:00:00") - new Date("2026-03-10T00:00:00")) / 86400000);
};

export default function ClientList({ clients, onSelectClient }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("billing");

  let filtered = clients.filter((c) => {
    const matchSearch = c.cliente.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return matchSearch;
    if (filter === "integral") return matchSearch && c.producto === "Integral";
    if (filter === "segsocial") return matchSearch && c.producto === "Seguridad Social";
    if (filter === "hosting") return matchSearch && c.hosting === "SI";
    if (filter === "no_hosting") return matchSearch && c.hosting === "NO";
    if (filter === "urgent") return matchSearch && daysUntil(c.vigencia) <= 90;
    return matchSearch;
  });

  filtered.sort((a, b) => {
    if (sort === "billing") return (b.billingUSD || 0) - (a.billingUSD || 0);
    if (sort === "renewal") return daysUntil(a.vigencia) - daysUntil(b.vigencia);
    if (sort === "name") return a.cliente.localeCompare(b.cliente);
    return 0;
  });

  // Base summary stats
  const totalLogos = filtered.length;
  const totalARR = filtered.reduce((s, c) => s + (c.billingUSD || 0), 0);
  const integralCount = filtered.filter((c) => c.producto === "Integral").length;
  const segSocialCount = filtered.filter((c) => c.producto === "Seguridad Social").length;
  const hostingCount = filtered.filter((c) => c.hosting === "SI").length;
  const noHostingCount = filtered.filter((c) => c.hosting === "NO").length;
  const integralARR = filtered.filter((c) => c.producto === "Integral").reduce((s, c) => s + (c.billingUSD || 0), 0);
  const segSocialARR = filtered.filter((c) => c.producto === "Seguridad Social").reduce((s, c) => s + (c.billingUSD || 0), 0);
  const hostingARR = filtered.filter((c) => c.hosting === "SI").reduce((s, c) => s + (c.billingUSD || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Active Customer Base</h2>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {totalLogos} logos &middot; {fmtUSD(totalARR)} total ARR
          </div>
        </div>
        <input
          className="search-input"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Base Summary KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="label">Total Logos</div>
          <div className="value purple">{totalLogos}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Total ARR</div>
          <div className="value">{fmtUSD(totalARR)}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Integral</div>
          <div className="value blue">{integralCount}</div>
          <div className="sub">{fmtUSD(integralARR)}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Seg. Social</div>
          <div className="value yellow">{segSocialCount}</div>
          <div className="sub">{fmtUSD(segSocialARR)}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Hosted</div>
          <div className="value green">{hostingCount}</div>
          <div className="sub">{fmtUSD(hostingARR)}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Not Hosted</div>
          <div className="value" style={{ color: "var(--text-muted)" }}>{noHostingCount}</div>
        </div>
      </div>

      <div className="filters">
        {[
          ["all", "All"],
          ["integral", "Integral"],
          ["segsocial", "Seg. Social"],
          ["hosting", "Hosted"],
          ["no_hosting", "Not Hosted"],
          ["urgent", "Urgent Renewal"],
        ].map(([key, label]) => (
          <button key={key} className={`filter-btn ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {[
            ["billing", "$ ARR"],
            ["renewal", "Renewal"],
            ["name", "Name"],
          ].map(([key, label]) => (
            <button key={key} className={`filter-btn ${sort === key ? "active" : ""}`} onClick={() => setSort(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Product</th>
              <th>Hosting</th>
              <th>ARR (USD)</th>
              <th>ARR (MXN)</th>
              <th>Renewal</th>
              <th>NPS</th>
              <th>Upsell</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="clickable" onClick={() => onSelectClient(c)}>
                <td>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{c.cliente}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{c.id}</div>
                </td>
                <td style={{ fontSize: 12 }}>{c.producto}</td>
                <td style={{ fontSize: 12 }}>{c.hosting}</td>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{fmtUSD(c.billingUSD || 0)}</td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  ${(c.billingMXN || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </td>
                <td>
                  <span style={{
                    color: daysUntil(c.vigencia) <= 30 ? "var(--red)" : daysUntil(c.vigencia) <= 90 ? "var(--yellow)" : "var(--text-muted)",
                    fontSize: 12,
                  }}>
                    {fmtDate(c.vigencia)}
                    {daysUntil(c.vigencia) <= 90 && daysUntil(c.vigencia) >= 0 && (
                      <span style={{ fontSize: 10, marginLeft: 3 }}>({daysUntil(c.vigencia)}d)</span>
                    )}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {c.npsScore != null ? c.npsScore : "—"}
                </td>
                <td style={{ fontSize: 12 }}>
                  {c.upsellPotential ? (
                    <span className={`badge ${c.upsellPotential === "high" ? "high" : c.upsellPotential === "medium" ? "medium" : "low"}`}>
                      {c.upsellPotential}
                    </span>
                  ) : <span style={{ color: "var(--text-dim)" }}>—</span>}
                </td>
                <td style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.observaciones || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
