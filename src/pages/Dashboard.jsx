import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { useApp } from '../store.jsx';
import { Card, Kpi, Chip, nf } from '../ui.jsx';
import CommandCenter from '../CommandCenter.jsx';
import { MEDS, PHCS, KEY_IDS, demandSeries, footfallSeries, medTotals, districtRisk, worstByPhc } from '../data.js';

const C = {
  brand: '#79A9D8',
  brandAlt: '#9B8BC9',
  mint: '#6FAE93',
  peach: '#E7A57A',
  sage: '#8DB69B',
  crit: '#E5484D',
  high: '#F05A5A',
  mod: '#D9A86A',
  low: '#7BB99A',
  grid: '#E9EEF3',
  ink: '#627781'
};
const riskColor = { CRITICAL: C.crit, HIGH: C.high, MODERATE: C.mod, LOW: C.low };
const axis = { tick: { fontSize: 11, fill: C.ink }, tickLine: false, axisLine: { stroke: C.grid } };

export default function Dashboard() {
  const { ev, kpis, mult, sim, worst, go, baseKpis } = useApp();
  const [med, setMed] = useState(0);
  const [filter, setFilter] = useState('ALL');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(12);
  const demand = useMemo(() => demandSeries(ev, med), [ev, med]);
  const foot = useMemo(() => footfallSeries(mult), [mult]);
  const stock = useMemo(() => medTotals(ev).filter((m) => m.key).map((m) => ({ name: m.name.replace(' (AL)', ''), cover: +m.exactDays.toFixed(1), risk: m.risk })), [ev]);
  const dr = useMemo(() => districtRisk(ev), [ev]);
  const list = useMemo(() => worst.filter(Boolean).filter((r) => (filter === 'ALL' || r.risk === filter) && (r.phcName + r.district + r.state).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.exactDays - b.exactDays), [worst, filter, q]);
  const delta = (a, b) => (b > a ? `▲ ${nf(b - a)} vs normal` : null);

  return (
    <>
      <CommandCenter />
      <div className="kpis">
        <Kpi label="Total PHCs" value={kpis.phcs} sub="6 states · 25 districts" />
        <Kpi label="Medicines tracked" value={kpis.meds} sub="8 essential + 34 others" />
        <Kpi label="Critical stock alerts" value={kpis.critical} tone={kpis.critical > 25 ? 'crit' : ''} sub={sim ? delta(baseKpis.critical, kpis.critical) : `${kpis.high} more at high risk`} />
        <Kpi label="Beds available" value={nf(kpis.beds)} sub={sim ? 'modelled occupancy rise' : 'across all PHCs'} />
        <Kpi label="Today's patients" value={nf(kpis.patients)} tone={sim ? 'high' : ''} sub={sim ? delta(8642, kpis.patients) : 'OPD footfall'} />
      </div>
      <div className="grid2">
        <Card title="Medicine demand over time" right={<select value={med} onChange={(e) => setMed(+e.target.value)} aria-label="Medicine">{MEDS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}>
          <p className="chart-note">Network total per day, 14 days actual and 7 days forecast ({MEDS[med].unit}).</p>
          <ResponsiveContainer width="100%" height={230}><LineChart data={demand}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="label" {...axis} interval={2} /><YAxis {...axis} width={48} tickFormatter={nf} /><Tooltip formatter={(v) => nf(v)} /><Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} /><Line name="Actual" dataKey="actual" stroke={C.brand} strokeWidth={3} dot={false} /><Line name="AI forecast" dataKey="forecast" stroke={C.brandAlt} strokeWidth={3} strokeDasharray="6 5" dot={false} /></LineChart></ResponsiveContainer>
        </Card>
        <Card title="Stock levels: network cover, essential medicines">
          <p className="chart-note">Days of stock at forecast demand. Dashed line = 7-day comfort level.</p>
          <ResponsiveContainer width="100%" height={230}><BarChart data={stock}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="name" {...axis} interval={0} tick={{ fontSize: 10, fill: C.ink }} /><YAxis {...axis} width={34} /><Tooltip formatter={(v) => `${v} days`} /><ReferenceLine y={7} stroke={C.ink} strokeDasharray="4 4" /><Bar dataKey="cover" name="Days of cover" radius={[3, 3, 0, 0]}>{stock.map((s, i) => <Cell key={i} fill={riskColor[s.risk]} />)}</Bar></BarChart></ResponsiveContainer>
        </Card>
        <Card title="Patient footfall">
          <p className="chart-note">Daily OPD patients across the network{sim ? ' — emergency surge applied to today and the forecast' : ''}.</p>
          <ResponsiveContainer width="100%" height={230}><AreaChart data={foot}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="label" {...axis} interval={2} /><YAxis {...axis} width={48} domain={['dataMin - 500', 'dataMax + 500']} tickFormatter={nf} /><Tooltip formatter={(v) => nf(v)} /><Area name="Actual" dataKey="actual" stroke={C.brand} fill={C.brand} fillOpacity={0.16} strokeWidth={3} /><Area name="Forecast" dataKey="forecast" stroke={C.mint} fill={C.mint} fillOpacity={0.10} strokeWidth={3} strokeDasharray="6 5" /></AreaChart></ResponsiveContainer>
        </Card>
        <Card title="District-wise stock risk">
          <p className="chart-note">Ten districts with the most critical and high-risk stock lines.</p>
          <ResponsiveContainer width="100%" height={230}><BarChart data={dr} layout="vertical" margin={{ left: 20 }}><CartesianGrid stroke={C.grid} horizontal={false} /><XAxis type="number" {...axis} /><YAxis type="category" dataKey="name" {...axis} width={100} /><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="critical" name="Critical" stackId="a" fill={C.crit} /><Bar dataKey="high" name="High" stackId="a" fill={C.high} /></BarChart></ResponsiveContainer>
        </Card>
      </div>
      <Card title="PHC network" right={<div className="filters"><input placeholder="Search PHC, district, state" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search PHCs" />{['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((f) => <button key={f} className={`pill ${filter === f ? 'on' : ''}`} onClick={() => { setFilter(f); setRows(12); }}>{f === 'ALL' ? 'All' : f[0] + f.slice(1).toLowerCase()}</button>)}</div>} pad={false}>
        <div className="tscroll"><table>
          <thead><tr><th>PHC</th><th>District</th><th>State</th><th className="r">Patients today</th><th>Critical medicine</th><th className="r">Current stock</th><th className="r">Days remaining</th><th>Risk</th><th>Action</th></tr></thead>
          <tbody>{list.slice(0, rows).map((r) => (
            <tr key={r.phc}><td><b>{r.phcName}</b></td><td>{r.district}</td><td>{r.state}</td><td className="r">{nf(PHCS[r.phc].patients * mult)}</td><td>{r.medName}</td><td className="r">{nf(r.stock)}</td><td className="r">{r.days}</td><td><Chip risk={r.risk} /></td><td><button className="btn sm" onClick={() => go('risk', r.id)}>Analyse</button></td></tr>
          ))}</tbody>
        </table></div>
        <div className="tfoot"><span className="muted">Showing {Math.min(rows, list.length)} of {list.length} PHCs, most urgent first</span>{rows < list.length && <button className="btn sm" onClick={() => setRows(rows + 24)}>Show more</button>}</div>
      </Card>
    </>
  );
}
