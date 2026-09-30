import React, { useMemo } from 'react';
import { useApp } from '../store.jsx';
import { Card, Kpi, nf } from '../ui.jsx';
import CommandCenter from '../CommandCenter.jsx';
import { medTotals, statusOf } from '../data.js';

export default function Emergency() {
  const { sim, setSim, pct, setPct, baseEv, simEv, baseKpis, simKpis, plan } = useApp();
  const b = useMemo(() => medTotals(baseEv).filter((m) => m.key), [baseEv]);
  const s = useMemo(() => medTotals(simEv).filter((m) => m.key), [simEv]);
  const bs = statusOf(baseKpis.critical), ss = statusOf(simKpis.critical);
  return (
    <>
      <Card title="Simulate Health Emergency">
        <p className="muted">Models a surge such as a disease outbreak or flood: OPD footfall rises and each medicine's demand rises according to how emergency-sensitive it is (ORS, IV fluids and antipyretics react most; insulin and iron/folic acid barely move).</p>
        <div className="sim-ctl">
          <label>Footfall surge: <b>+{pct}%</b><input type="range" min="30" max="50" step="5" value={pct} onChange={(e) => setPct(+e.target.value)} aria-label="Footfall surge percent" /></label>
          <button className={`btn ${sim ? 'danger-o' : 'danger'}`} onClick={() => setSim(!sim)}>{sim ? 'End simulation' : 'Simulate Health Emergency'}</button>
        </div>
      </Card>
      <div className="ba">
        <div className="ba-col"><div className="ba-h">BEFORE EMERGENCY</div><div className="ba-state ok">{bs}</div>
          <div className="kpis two"><Kpi label="Critical alerts" value={baseKpis.critical} /><Kpi label="High-risk lines" value={baseKpis.high} /><Kpi label="Today's patients" value={nf(baseKpis.patients)} /><Kpi label="Beds available" value={nf(baseKpis.beds)} /></div></div>
        <div className="ba-arrow" aria-hidden>→</div>
        <div className={`ba-col ${sim ? 'live' : 'idle'}`}><div className="ba-h">AFTER SIMULATION</div>
          {sim ? <><div className="ba-state bad">{ss}</div>
            <div className="kpis two"><Kpi label="Critical alerts" value={simKpis.critical} tone="crit" sub={`▲ ${simKpis.critical - baseKpis.critical} more`} /><Kpi label="High-risk lines" value={simKpis.high} sub={`${simKpis.high - baseKpis.high >= 0 ? '▲' : '▼'} ${Math.abs(simKpis.high - baseKpis.high)}`} /><Kpi label="Today's patients" value={nf(simKpis.patients)} tone="high" sub={`▲ ${nf(simKpis.patients - baseKpis.patients)}`} /><Kpi label="Beds available" value={nf(simKpis.beds)} sub={`▼ ${nf(baseKpis.beds - simKpis.beds)} (modelled)`} /></div></>
            : <div className="ba-wait">Press “Simulate Health Emergency” to recalculate demand, days remaining and stock-out risk for all {nf(simEv.length)} stock lines.</div>}
        </div>
      </div>
      {sim && (
        <>
          <Card title="Essential medicines: network days of cover" pad={false}>
            <div className="tscroll"><table>
              <thead><tr><th>Medicine</th><th className="r">Before</th><th className="r">After</th><th className="r">PHCs critical before</th><th className="r">PHCs critical after</th></tr></thead>
              <tbody>{b.map((m, i) => <tr key={m.id}><td><b>{m.name}</b></td><td className="r">{m.exactDays.toFixed(1)} d</td><td className="r"><b>{s[i].exactDays.toFixed(1)} d</b></td><td className="r">{m.critical}</td><td className="r"><b className={s[i].critical > m.critical ? 'txt-crit' : ''}>{s[i].critical}</b></td></tr>)}</tbody>
            </table></div>
          </Card>
          <p className="muted">Redistribution now needed: <b>{plan.length}</b> transfers moving <b>{nf(plan.reduce((a, p) => a + p.qty, 0))}</b> units. The panel below asks the AI to analyse the changed situation.</p>
          <CommandCenter />
        </>
      )}
    </>
  );
}
