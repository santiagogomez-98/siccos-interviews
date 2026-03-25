import React, { useState, useMemo } from "react";
import Dashboard from "./components/Dashboard";
import ClientDetail from "./components/ClientDetail";
import ClientList from "./components/ClientList";
import CrossAnalysis from "./components/CrossAnalysis";
import Upsell from "./components/Upsell";
import { interviews, FX_RATE } from "./data/clientData";
import allClientsRaw from "./data/allClients";
import "./App.css";

const WEIGHTS = { core: 2, support: 1.5, blocker: 2 };
const POS_BIAS = 2.0;
const sumW = (items) => (items || []).filter((i) => i.w !== "minor").reduce((s, i) => s + (WEIGHTS[i.w] || 1), 0);

const calcSatisfaction = (summary) => {
  if (!summary) return null;
  const wPos = sumW(summary.positives) * POS_BIAS;
  const wNeg = sumW(summary.negatives);
  const total = wPos + wNeg;
  if (total === 0) return null;
  return Math.min(10, Math.round((wPos / total) * 100) / 10);
};

const calcRisk = (summary, satisfaction, vigencia) => {
  if (!summary) return null;
  const days = vigencia ? Math.ceil((new Date(vigencia + "T00:00:00") - new Date("2026-03-10T00:00:00")) / 86400000) : Infinity;
  const sent = summary.sentiment;
  let risk = "low";
  if (sent === "negative" || satisfaction < 5) risk = "high";
  else if (satisfaction < 6.5 || sent === "neutral") risk = "medium";
  if (days <= 60) {
    if (risk === "low") risk = "medium";
    else if (risk === "medium") risk = "high";
  }
  return risk;
};

function App() {
  const [view, setView] = useState("summary");
  const [selectedClient, setSelectedClient] = useState(null);

  // Add default NPS and upsell fields to all clients, merge interview data
  const allClients = useMemo(() => {
    const interviewMap = {};
    interviews.forEach((iv) => { interviewMap[iv.id] = iv; });
    return allClientsRaw.map((c) => {
      const iv = interviewMap[c.id];
      const base = { ...c, npsScore: null, upsellPotential: null };
      if (iv) return { ...base, ...iv, billingUSD: iv.billingUSD || c.billingUSD };
      return base;
    });
  }, []);

  const interviewData = useMemo(() => ({
    interviews: interviews.map((iv) => {
      const base = allClientsRaw.find((c) => c.id === iv.id);
      const merged = base ? { ...base, ...iv, npsScore: null } : { ...iv, npsScore: null };
      const sat = calcSatisfaction(merged.summary);
      const risk = calcRisk(merged.summary, sat, merged.vigencia);
      if (merged.summary) { merged.summary.computedRisk = risk; merged.satisfaction = sat; }
      return merged;
    }),
    FX_RATE,
  }), []);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setView("detail");
  };

  const renderView = () => {
    switch (view) {
      case "interviews":
        return <Dashboard data={interviewData} onSelectClient={handleSelectClient} />;
      case "clients":
        return <ClientList clients={allClients} onSelectClient={handleSelectClient} />;
      case "detail":
        return <ClientDetail client={selectedClient} onBack={() => setView(selectedClient?.interviewStatus ? "interviews" : "clients")} />;
      case "summary":
        return <CrossAnalysis data={interviewData} />;
      case "upsell":
        return <Upsell clients={allClients} onSelectClient={handleSelectClient} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <img src="/crehana-logo.svg" alt="Crehana" className="header-logo" />
          <h1>Siccos Interview Tracker</h1>
          <span className="header-subtitle">M&A Due Diligence</span>
        </div>
        <nav className="header-nav">
          <button className={view === "summary" ? "active" : ""} onClick={() => setView("summary")}>
            Summary
          </button>
          <button className={view === "interviews" ? "active" : ""} onClick={() => setView("interviews")}>
            Interviews
          </button>
          <button className={view === "clients" ? "active" : ""} onClick={() => setView("clients")}>
            All Customers
          </button>
          <button className={view === "upsell" ? "active" : ""} onClick={() => setView("upsell")}>
            Crehana Cross-sell
          </button>
        </nav>
      </header>
      <main className="app-main">{renderView()}</main>
    </div>
  );
}

export default App;
