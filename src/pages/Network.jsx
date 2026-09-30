import React, { useMemo, useState } from 'react';
import { useApp } from '../store.jsx';
import { Card, Chip, nf } from '../ui.jsx';
import { PHCS, stateSummary } from '../data.js';

const TIERS = [
  ['PHC', 'Records stock, dispensing, OPD footfall, beds and staff attendance', 'Raw facility data stays here'],
  ['District Health System', 'Aggregates PHC data, runs local stock-out alerts and district transfers', 'Patient-level and facility data stay in the district'],
  ['State Health System', 'Balances stock across districts, keeps the state data store', 'Operational data stays with the state'],
  ['National Health Intelligence Layer', 'Standardised risk scores, demand-forecast features and model updates from every state', 'Only shared intelligence moves up, never raw records']
];

export default function Network() {
  const { ev, worst } = useApp();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(15);
  const states = useMemo(() => stateSummary(ev), [ev]);
  const list = PHCS.filter((p) => (p.name + p.district + p.state).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Card title="Federated architecture (concept demonstration)">
        <div className="arch">
          {TIERS.map((t, i) => (
            <React.Fragment key={t[0]}>
              <div className={`tier t${i}`}><div><h4>{t[0]}</h4><p>{t[1]}</p></div><div className="tier-note">{t[2]}</div></div>
              {i < TIERS.length - 1 && <div className="arrow" aria-hidden>↓ <span>standardised alerts and model outputs</span></div>}
            </React.Fragment>
          ))}
        </div>
        <p className="muted small">In this prototype the four tiers are simulated in one app using synthetic district and state datasets. The design lets each state or district keep its operational data while sharing standardised intelligence with the national layer. No nationwide infrastructure is implemented.</p>
      </Card>
      <Card title="State and district roll-up" pad={false}>
        <div className="tscroll"><table>
          <thead><tr><th>State</th><th className="r">Districts</th><th className="r">PHCs</th><th className="r">Beds available</th><th className="r">Staff attendance</th><th className="r">Critical lines</th><th className="r">High lines</th></tr></thead>
          <tbody>{states.map((s) => <tr key={s.state}><td><b>{s.state}</b></td><td className="r">{s.districts}</td><td className="r">{s.phcs}</td><td className="r">{nf(s.beds)}</td><td className="r">{s.attendance}%</td><td className="r"><b className={s.critical ? 'txt-crit' : ''}>{s.critical}</b></td><td className="r">{s.high}</td></tr>)}</tbody>
        </table></div>
      </Card>
      <Card title="PHC directory" right={<input placeholder="Search PHC, district, state" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search PHCs" />} pad={false}>
        <div className="tscroll"><table>
          <thead><tr><th>PHC</th><th>District</th><th>State</th><th className="r">Beds</th><th className="r">Staff present</th><th className="r">Attendance</th><th>Worst stock line</th><th>Risk</th></tr></thead>
          <tbody>{list.slice(0, rows).map((p) => { const w = worst[p.id]; return <tr key={p.id}><td><b>{p.name}</b></td><td>{p.district}</td><td>{p.state}</td><td className="r">{p.beds}</td><td className="r">{p.present} / {p.staff}</td><td className="r">{Math.round((p.present / p.staff) * 100)}%</td><td>{w.medName} · {w.days} d</td><td><Chip risk={w.risk} /></td></tr>; })}</tbody>
        </table></div>
        <div className="tfoot"><span className="muted">Showing {Math.min(rows, list.length)} of {list.length}</span>{rows < list.length && <button className="btn sm" onClick={() => setRows(rows + 30)}>Show more</button>}</div>
      </Card>
    </>
  );
}
