import React, { useEffect, useState } from 'react';
import { useApp } from './store.jsx';
import { api } from './api.js';
import { donorCandidates, needUnits } from './data.js';
import { Chip, Runway, SourceBadge, Advisories, nf, dayText } from './ui.jsx';

export default function CommandCenter() {
  const { ev, top, plan, sim, pct, approve, applied, lang } = useApp();
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { setAi(null); setErr(''); }, [top?.id, top?.stock, sim, pct]);
  if (!top) return null;

  const emergency = sim ? { active: true, footfallIncreasePct: pct } : { active: false };
  const uplift = Math.max(0, Math.round((top.predicted / top.avg - 1) * 100));
  const local = plan.find((p) => p.target.id === top.id);
  const cands = donorCandidates(ev, top, 3).map((d) => ({ id: d.id, phc: d.phcName, district: d.district, state: d.state, surplus: d.surplus, distanceKm: d.km }));

  async function run() {
    setBusy(true); setErr('');
    try {
      const [analysis, planR] = await Promise.all([
        api.analyze({ phc: top.phcName, district: top.district, medicine: top.medName, unit: top.unit, currentStock: top.stock, dailyDemand: top.avg, predictedDemand: top.predicted, daysRemaining: top.days, safetyStock: top.safety, emergency, donors: cands }),
        api.plan({ target: { phc: top.phcName, district: top.district, medicine: top.medName, unit: top.unit, currentStock: top.stock, predictedDemand: top.predicted, daysRemaining: top.days, safetyStock: top.safety }, need: needUnits(top), donors: cands, emergency })
      ]);
      setAi({ analysis, plan: planR });
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  const rec = ai ? ai.plan : local && { transferQty: local.qty, fromPhc: local.donor.phcName, fromDistrict: local.donor.district, toPhc: top.phcName, distanceKm: local.km, etaHours: local.etaHrs, donorId: local.donor.id, expectedDaysAfterTransfer: +local.newDays.toFixed(1), rationale: `${local.donor.phcName} has surplus stock while ${top.phcName} has elevated projected demand.` };
  const done = rec && rec.donorId != null && applied.some((a) => a.toId === top.id && a.fromId === rec.donorId);

  return (
    <section className={`cc ${top.risk === 'CRITICAL' ? 'cc-crit' : ''}`}>
      <div className="cc-head">
        <div><h2>AI Supply Chain Command Center</h2><p className="muted">Most urgent issue across {nf(ev.length)} PHC–medicine stock lines{sim ? ` · emergency simulation +${pct}% footfall` : ''}</p></div>
        <Chip risk={top.risk} />
      </div>
      <div className="cc-grid">
        <div>
          <div className="cc-alert">{top.risk === 'CRITICAL' ? 'CRITICAL STOCK-OUT RISK' : `${top.risk} STOCK RISK`}</div>
          <div className="cc-title">{top.phcName}</div>
          <div className="cc-med">{top.medName} <span className="muted">· {top.district}</span></div>
          <div className="cc-days"><strong>{dayText(top.days)}</strong> of stock remaining <span className="muted">({nf(top.stock)} {top.unit} ÷ {top.predicted}/day)</span></div>
          <Runway exactDays={top.exactDays} risk={top.risk} />
          <div className="cc-label">{ai ? 'Analysis' : 'Local forecast'} {ai ? <SourceBadge r={ai.analysis} /> : <span className="src local">calculated in the browser</span>}</div>
          <p className="quote">{ai ? ai.analysis.reason : `Projected patient demand is approximately ${uplift}% above current consumption. At the current burn rate, available ${top.medName} stock is likely to fall below safety levels within ${dayText(top.days)}.`}</p>
          {ai && <p className="muted small"><strong>Action:</strong> {ai.analysis.recommendedAction} <span className="conf">confidence {Math.round(ai.analysis.confidence * 100)}%</span></p>}
        </div>
        <div className="cc-rec">
          <div className="cc-label">Recommended action</div>
          {!rec || !rec.fromPhc ? (
            <>
              <p className="muted">No cross-district donor has surplus {top.medName}. Escalate to a state-level indent.</p>
              <div className="btn-row"><button className="btn primary" onClick={run} disabled={busy}>{busy ? 'Asking AI…' : 'Generate AI Redistribution Plan'}</button></div>
            </>
          ) : (
            <>
              <div className="xfer">
                <div><span className="muted small">Transfer</span><b>{nf(rec.transferQty)} {top.medName}</b></div>
                <div><span className="muted small">From</span><b>{rec.fromPhc}</b><span className="muted small">{rec.fromDistrict} · {rec.distanceKm} km</span></div>
                <div><span className="muted small">To</span><b>{rec.toPhc}</b><span className="muted small">arrives in ~{rec.etaHours} h</span></div>
              </div>
              <p className="small"><strong>Reason:</strong> {rec.rationale}</p>
              <p className="muted small">After transfer: about {rec.expectedDaysAfterTransfer} days of cover.{ai && ai.plan.riskIfNoAction ? ` If no action: ${ai.plan.riskIfNoAction}` : ''}</p>
              {ai && <div className="cc-src"><SourceBadge r={ai.plan} /></div>}
              <div className="btn-row">
                <button className="btn primary" onClick={run} disabled={busy}>{busy ? 'Asking AI…' : 'Generate AI Redistribution Plan'}</button>
                <button className="btn" disabled={done || !rec.donorId} onClick={() => approve({ toId: top.id, fromId: rec.donorId, qty: rec.transferQty, medName: top.medName, toName: top.phcName, fromName: rec.fromPhc })}>{done ? 'Approved' : 'Approve transfer'}</button>
              </div>
            </>
          )}
          {err && <p className="err">AI request failed: {err}</p>}
        </div>
      </div>
      <div className="cc-adv"><div className="cc-label">Advisory{lang !== 'en' ? ' (translated)' : ''}</div><Advisories recs={[top]} /></div>
    </section>
  );
}
