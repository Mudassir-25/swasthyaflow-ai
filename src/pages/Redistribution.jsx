import React, { useState } from 'react';
import { useApp } from '../store.jsx';
import { Card, Kpi, Chip, nf } from '../ui.jsx';
import CommandCenter from '../CommandCenter.jsx';

export default function Redistribution() {
  const { plan, applied, approve, go } = useApp();
  const [rows, setRows] = useState(15);
  const units = plan.reduce((a, p) => a + p.qty, 0);
  return (
    <>
      <div className="kpis three">
        <Kpi label="Proposed transfers" value={plan.length} sub="critical and high-risk lines with a donor" />
        <Kpi label="Units to move" value={nf(units)} sub="nearest donor with surplus, cross-district" />
        <Kpi label="Approved this session" value={applied.length} sub="stock levels update instantly" />
      </div>
      <CommandCenter />
      <Card title="Recommended transfer plan" right={<span className="muted small">Donors keep 10 days of their own cover. Targets are topped up to about 7 days.</span>} pad={false}>
        <div className="tscroll"><table>
          <thead><tr><th>Medicine</th><th>To (short)</th><th>From (surplus)</th><th className="r">Distance</th><th className="r">Quantity</th><th className="r">Days now → after</th><th>Risk</th><th>Admin action</th></tr></thead>
          <tbody>{plan.slice(0, rows).map((p) => (
            <tr key={p.target.id}>
              <td><b>{p.target.medName}</b></td><td>{p.target.phcName}<span className="muted small block">{p.target.district}</span></td><td>{p.donor.phcName}<span className="muted small block">{p.donor.district} · {nf(p.donor.surplus)} spare</span></td>
              <td className="r">{p.km} km</td><td className="r"><b>{nf(p.qty)}</b></td><td className="r">{p.target.days} → {Math.round(p.newDays)}</td><td><Chip risk={p.target.risk} /></td>
              <td><div className="btn-row tight"><button className="btn sm primary" onClick={() => approve({ toId: p.target.id, fromId: p.donor.id, qty: p.qty, medName: p.target.medName, toName: p.target.phcName, fromName: p.donor.phcName })}>Approve</button><button className="btn sm" onClick={() => go('risk', p.target.id)}>AI review</button></div></td>
            </tr>))}</tbody>
        </table></div>
        <div className="tfoot"><span className="muted">Showing {Math.min(rows, plan.length)} of {plan.length} transfers</span>{rows < plan.length && <button className="btn sm" onClick={() => setRows(rows + 25)}>Show more</button>}</div>
      </Card>
      <Card title="Approved transfers (action log)">
        {applied.length === 0 ? <p className="muted">No transfers approved yet. Approve one above and watch its risk drop.</p> : (
          <ul className="log">{[...applied].reverse().map((a) => <li key={a.n}><span className="muted small">{a.at}</span> <b>{nf(a.qty)} {a.medName}</b> from {a.fromName} to {a.toName} <span className="chip low">APPROVED</span></li>)}</ul>
        )}
      </Card>
    </>
  );
}
