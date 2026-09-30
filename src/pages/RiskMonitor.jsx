import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store.jsx';
import { api } from '../api.js';
import { donorCandidates } from '../data.js';
import { Card, Chip, Runway, SourceBadge, Advisories, useTranslated, nf, dayText } from '../ui.jsx';

export default function RiskMonitor() {
  const { ev, selected, setSelected, top, sim, pct, lang, go } = useApp();
  const alerts = useMemo(() => ev.filter((r) => r.risk === 'CRITICAL' || r.risk === 'HIGH').sort((a, b) => a.exactDays - b.exactDays), [ev]);
  const cur = ev[selected ?? top?.id] || top;
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { setRes(null); setErr(''); }, [cur?.id, cur?.stock, sim, pct]);
  const tr = useTranslated(res ? [{ text: res.recommendedAction }] : [], lang);

  async function run() {
    setBusy(true); setErr('');
    try {
      const donors = donorCandidates(ev, cur, 3).map((d) => ({ id: d.id, phc: d.phcName, district: d.district, state: d.state, surplus: d.surplus, distanceKm: d.km }));
      setRes(await api.analyze({ phc: cur.phcName, district: cur.district, medicine: cur.medName, unit: cur.unit, currentStock: cur.stock, dailyDemand: cur.avg, predictedDemand: cur.predicted, daysRemaining: cur.days, safetyStock: cur.safety, emergency: sim ? { active: true, footfallIncreasePct: pct } : { active: false }, donors }));
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  return (
    <div className="split">
      <Card title={`Active alerts (${alerts.length})`} pad={false} className="alist">
        <ul className="alerts">{alerts.slice(0, 60).map((r) => (
          <li key={r.id}><button className={r.id === cur.id ? 'on' : ''} onClick={() => setSelected(r.id)}>
            <span><b>{r.medName}</b> · {r.phcName}<span className="muted small block">{r.district}, {r.state}</span></span><span className="r"><Chip risk={r.risk} /><span className="muted small block">{dayText(r.days)}</span></span>
          </button></li>))}</ul>
      </Card>
      <div className="stack">
        <Card title={`${cur.medName} at ${cur.phcName}`} right={<Chip risk={cur.risk} />}>
          <p className="muted">{cur.district}, {cur.state}</p>
          <div className="stats">
            <div><span>Current stock</span><b>{nf(cur.stock)}</b></div><div><span>Avg daily demand</span><b>{cur.avg}</b></div><div><span>Predicted demand</span><b>{cur.predicted}</b></div>
            <div><span>Days remaining</span><b>{cur.days}</b></div><div><span>Safety stock</span><b>{cur.safety}</b></div><div><span>Below safety?</span><b>{cur.stock < cur.safety ? 'Yes' : 'No'}</b></div>
          </div>
          <Runway exactDays={cur.exactDays} risk={cur.risk} />
          <div className="btn-row"><button className="btn primary" onClick={run} disabled={busy}>{busy ? 'Analysing…' : 'Run AI risk analysis'}</button><button className="btn" onClick={() => go('redistribution')}>Open redistribution</button></div>
          {err && <p className="err">AI request failed: {err}</p>}
        </Card>
        {res && (
          <Card title="AI risk analysis" right={<SourceBadge r={res} />}>
            <div className="ai-row"><Chip risk={res.riskLevel} /><span className="muted small">confidence {Math.round(res.confidence * 100)}% · predicted {res.predictedDemand}/day · stock-out in ~{res.estimatedStockoutDays} d</span></div>
            <h4>Why</h4><p>{res.reason}</p>
            <h4>Recommended action</h4><p>{res.recommendedAction}</p>
            {lang !== 'en' && <p className="adv-t" lang={lang}>{tr.error ? 'Translation unavailable' : tr.out ? (tr.translated ? tr.out[0] : 'Free-text translation needs Gemini (add GEMINI_API_KEY). Shown in English in Demo Mode.') : 'Translating…'}</p>}
            <h4>Redistribution</h4><p>{res.redistributionRecommendation}</p>
          </Card>
        )}
        <Card title={`Early-warning advisories${lang !== 'en' ? ' (translated)' : ''}`}><Advisories recs={alerts.slice(0, 4)} /></Card>
      </div>
    </div>
  );
}
