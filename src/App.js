import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import ClientDetail from "./components/ClientDetail";
import ClientList from "./components/ClientList";
import CrossAnalysis from "./components/CrossAnalysis";
import clientData from "./data/clientData";
import "./App.css";

function App() {
  const [view, setView] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState(null);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setView("detail");
  };

  const renderView = () => {
    switch (view) {
      case "dashboard":
        return (
          <Dashboard data={clientData} onSelectClient={handleSelectClient} />
        );
      case "list":
        return (
          <ClientList
            interviews={clientData.interviews}
            onSelectClient={handleSelectClient}
          />
        );
      case "detail":
        return (
          <ClientDetail client={selectedClient} onBack={() => setView("list")} />
        );
      case "analysis":
        return <CrossAnalysis data={clientData} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Siccos — Client Interview Tracker</h1>
          <span className="header-subtitle">M&A Due Diligence</span>
        </div>
        <nav className="header-nav">
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => setView("dashboard")}
          >
            Overview
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            Client Base
          </button>
          <button
            className={view === "analysis" ? "active" : ""}
            onClick={() => setView("analysis")}
          >
            Cross-Analysis
          </button>
        </nav>
      </header>
      <main className="app-main">{renderView()}</main>
    </div>
  );
}

export default App;
