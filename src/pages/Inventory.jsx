import React, { useMemo, useState } from 'react';
import { useApp } from '../store.jsx';
import { Card, Chip, nf } from '../ui.jsx';
import { medTotals } from '../data.js';

export default function Inventory() {
  const { ev, go } = useApp();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const tot = useMemo(() => medTotals(ev), [ev]);
  const rows = tot.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.exactDays - b.exactDays);
  const drill = useMemo(() => ev.filter((r) => r.med === sel).sort((a, b) => a.exactDays - b.exactDays).slice(0, 10), [ev, sel]);
  const m = tot[sel];
  return (
    <>
      <Card title="Medicine inventory: network view" right={<input placeholder="Search medicine" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search medicine" />} pad={false}>
        <div className="tscroll tall"><table>
          <thead><tr><th>Medicine</th><th className="r">Current stock</th><th className="r">Avg daily consumption</th><th className="r">Predicted demand / day</th><th className="r">Days remaining</th><th className="r">Min. safety stock</th><th>Network risk</th><th className="r">PHCs critical / high</th></tr></thead>
          <tbody>{rows.map((x) => (
            <tr key={x.id} className={x.id === sel ? 'sel' : ''} onClick={() => setSel(x.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(x.id)}>
              <td><b>{x.name}</b> <span className="muted small">{x.unit}</span></td><td className="r">{nf(x.stock)}</td><td className="r">{nf(x.avg)}</td><td className="r">{nf(x.predicted)}</td><td className="r">{x.days}</td><td className="r">{nf(x.safety)}</td><td><Chip risk={x.risk} /></td><td className="r"><b className={x.critical ? 'txt-crit' : ''}>{x.critical}</b> / {x.high}</td>
            </tr>))}</tbody>
        </table></div>
      </Card>
      <Card title={`${m.name}: PHCs closest to a stock-out`} right={<span className="muted small">Select a medicine row above to change this list</span>} pad={false}>
        <div className="tscroll"><table>
          <thead><tr><th>PHC</th><th>District</th><th className="r">Stock</th><th className="r">Avg daily</th><th className="r">Predicted</th><th className="r">Days</th><th className="r">Safety stock</th><th>Risk</th><th>Action</th></tr></thead>
          <tbody>{drill.map((r) => (<tr key={r.id}><td><b>{r.phcName}</b></td><td>{r.district}</td><td className="r">{nf(r.stock)}</td><td className="r">{r.avg}</td><td className="r">{r.predicted}</td><td className="r">{r.days}</td><td className="r">{r.safety}</td><td><Chip risk={r.risk} /></td><td><button className="btn sm" onClick={() => go('risk', r.id)}>Analyse</button></td></tr>))}</tbody>
        </table></div>
      </Card>
    </>
  );
}
