import React from 'react';
import { AppProvider, useApp } from './store.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import RiskMonitor from './pages/RiskMonitor.jsx';
import Redistribution from './pages/Redistribution.jsx';
import Network from './pages/Network.jsx';
import Emergency from './pages/Emergency.jsx';

const NAV = [['dashboard', 'Dashboard', Dashboard], ['inventory', 'Medicine Inventory', Inventory], ['risk', 'AI Risk Monitor', RiskMonitor], ['redistribution', 'Redistribution', Redistribution], ['network', 'PHC Network', Network], ['emergency', 'Emergency Simulation', Emergency]];

function Shell() {
  const { page, go, status, lang, setLang, sim, setSim, pct, kpis, reset, toast } = useApp();
  const Page = NAV.find((n) => n[0] === page)[2];
  const live = status?.geminiConfigured;
  const current = NAV.find((n) => n[0] === page);
  const headerTitle = page === 'dashboard' ? 'Healthcare Intelligence' : current[1];
  const headerSubtitle = page === 'dashboard' ? 'Real-time visibility across the PHC network' : 'Operational overview and response coordination';

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <div className="logo" aria-hidden>S</div>
          <div>
            <b>SwasthyaFlow AI</b>
            <span>Predict shortages. Move resources before patients are affected.</span>
          </div>
        </div>
        <nav aria-label="Main">{NAV.map(([id, label]) => <button key={id} className={page === id ? 'on' : ''} onClick={() => go(id)} aria-current={page === id ? 'page' : undefined}>{label}{id === 'risk' && <em>{kpis.critical}</em>}</button>)}</nav>
        <div className="side-foot">Prototype — Synthetic Demonstration Data. Not real government PHC data.</div>
      </aside>
      <div className="main">
        <header className="top">
          <div className="top-copy">
            <div className="eyebrow">Healthcare Intelligence</div>
            <h1>{headerTitle}</h1>
            <p>{headerSubtitle}</p>
          </div>
          <div className="top-r">
            <span className="proto">Prototype — Synthetic Demonstration Data</span>
            {status && <span className={`mode ${live ? 'live' : 'demo'}`} title={live ? 'Gemini API key detected on the server' : 'No GEMINI_API_KEY on the server: AI panels use labelled deterministic responses'}>{live ? `GEMINI LIVE · ${status.model}` : 'DEMO MODE'}</span>}
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language"><option value="en">English</option><option value="hi">हिन्दी</option><option value="kn">ಕನ್ನಡ</option><option value="ta">தமிழ்</option></select>
            <button className={`btn ${sim ? 'danger-o' : 'danger'}`} onClick={() => setSim(!sim)}>{sim ? 'End emergency' : 'Simulate Health Emergency'}</button>
            <button className="btn ghost" onClick={reset} title="Clear approvals and end simulation">Reset</button>
          </div>
        </header>
        {sim && <div className="banner">EMERGENCY SIMULATION ACTIVE — footfall +{pct}% · {kpis.critical} critical stock alerts</div>}
        <main className="content"><Page /></main>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
export default function App() { return <AppProvider><Shell /></AppProvider>; }
