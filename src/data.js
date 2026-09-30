// Synthetic demonstration data for SwasthyaFlow AI. NOT real government PHC data.
function rng(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = rng(20260930);
const rnd = (a, b) => a + R() * (b - a);
const rint = (a, b) => Math.round(rnd(a, b));

export const DISTRICTS = [
  ['Krishnagiri', 'Tamil Nadu', 12.52, 78.21], ['Salem', 'Tamil Nadu', 11.66, 78.15], ['Dharmapuri', 'Tamil Nadu', 12.13, 78.16],
  ['Vellore', 'Tamil Nadu', 12.92, 79.13], ['Chennai', 'Tamil Nadu', 13.08, 80.27], ['Madurai', 'Tamil Nadu', 9.92, 78.12],
  ['Coimbatore', 'Tamil Nadu', 11.02, 76.96], ['Bengaluru Urban', 'Karnataka', 12.97, 77.59], ['Bengaluru Rural', 'Karnataka', 13.18, 77.29],
  ['Mysuru', 'Karnataka', 12.3, 76.64], ['Tumakuru', 'Karnataka', 13.34, 77.1], ['Kolar', 'Karnataka', 13.14, 78.13],
  ['Mandya', 'Karnataka', 12.52, 76.9], ['Hyderabad', 'Telangana', 17.39, 78.49], ['Rangareddy', 'Telangana', 17.25, 78.15],
  ['Warangal', 'Telangana', 17.97, 79.6], ['Pune', 'Maharashtra', 18.52, 73.86], ['Nashik', 'Maharashtra', 20.0, 73.79],
  ['Nagpur', 'Maharashtra', 21.15, 79.09], ['Jaipur', 'Rajasthan', 26.91, 75.79], ['Jodhpur', 'Rajasthan', 26.24, 73.02],
  ['Udaipur', 'Rajasthan', 24.59, 73.71], ['Lucknow', 'Uttar Pradesh', 26.85, 80.95], ['Kanpur', 'Uttar Pradesh', 26.45, 80.35],
  ['Varanasi', 'Uttar Pradesh', 25.32, 82.97]
].map(([name, state, lat, lon]) => ({ name, state, lat, lon }));
const DMAP = Object.fromEntries(DISTRICTS.map((d) => [d.name, d]));
export const STATE_LIST = [...new Set(DISTRICTS.map((d) => d.state))];

const SUFFIX = ['', 'North', 'South', 'East', 'West', 'Rural', 'Town', 'Block II', 'Block III', 'Block IV'];
const KRISH = ['Krishnagiri', 'Hosur', 'Denkanikottai', 'Shoolagiri', 'Bargur', 'Uthangarai', 'Pochampalli', 'Kelamangalam', 'Veppanahalli', 'Mathur'];

export const PHCS = [];
DISTRICTS.forEach((d, di) => {
  const n = di >= 23 ? 9 : 10; // 23*10 + 2*9 = 248
  for (let i = 0; i < n; i++) {
    const name = d.name === 'Krishnagiri' ? `${KRISH[i]} PHC` : `${d.name}${SUFFIX[i] ? ' ' + SUFFIX[i] : ''} PHC`;
    const staff = rint(6, 14);
    PHCS.push({ id: PHCS.length, name, district: d.name, state: d.state, staff, present: Math.round(staff * rnd(0.68, 0.98)), _p: rnd(20, 60), _b: rnd(2, 8) });
  }
});
function fit(raw, total) {
  const s = raw.reduce((a, b) => a + b, 0);
  const v = raw.map((x) => Math.floor((x * total) / s));
  let r = total - v.reduce((a, b) => a + b, 0);
  for (let i = 0; r > 0; i = (i + 1) % v.length, r--) v[i]++;
  return v;
}
const pat = fit(PHCS.map((p) => p._p), 8642);
const bed = fit(PHCS.map((p) => p._b), 1284);
PHCS.forEach((p, i) => { p.patients = pat[i]; p.beds = bed[i]; delete p._p; delete p._b; });

// [name, unit, dailyLow, dailyHigh, emergency sensitivity]
const KEYMEDS = [
  ['ORS', 'sachets', 60, 130, 1.25], ['Paracetamol', 'tablets', 300, 700, 1.1], ['Amoxicillin', 'capsules', 120, 300, 1.0],
  ['Insulin', 'vials', 8, 25, 0.15], ['Azithromycin', 'tablets', 60, 160, 1.0], ['IV Fluids', 'bags', 25, 70, 1.2],
  ['Antimalarial (AL)', 'courses', 10, 40, 0.9], ['Iron/Folic Acid', 'tablets', 200, 450, 0.1]
];
const OTHERS = ['Metformin', 'Amlodipine', 'Atenolol', 'Cetirizine', 'Ibuprofen', 'Doxycycline', 'Ciprofloxacin', 'Metronidazole', 'Salbutamol Inhaler', 'Zinc Tablets', 'Vitamin A', 'Vitamin B Complex', 'Omeprazole', 'Albendazole', 'Oral Contraceptive Pills', 'Tetanus Toxoid', 'Rabies Vaccine', 'Anti-Snake Venom', 'Chlorhexidine', 'Povidone Iodine', 'Diclofenac', 'Ondansetron', 'Cotrimoxazole', 'Gentamicin', 'Oxytocin', 'Magnesium Sulphate', 'Glimepiride', 'Enalapril', 'Atorvastatin', 'Pantoprazole', 'Dexamethasone', 'Adrenaline', 'Ringer Lactate', 'Calcium Tablets'];
export const MEDS = [
  ...KEYMEDS.map(([name, unit, lo, hi, sens], id) => ({ id, name, unit, lo, hi, sens, key: true })),
  ...OTHERS.map((name, i) => ({ id: 8 + i, name, unit: 'units', lo: 20, hi: 200, sens: +(0.2 + (i % 7) * 0.08).toFixed(2), key: false }))
];
export const KEY_IDS = [0, 1, 2, 3, 4, 5, 6, 7];
const SENS_IDS = [0, 1, 2, 4, 5, 6];

export const RECORDS = [];
PHCS.forEach((p) => MEDS.forEach((m) => {
  const avg = rint(m.lo, m.hi);
  RECORDS.push({ id: RECORDS.length, phc: p.id, med: m.id, avg, predBase: Math.round(avg * rnd(1.0, 1.12)), safety: Math.round(avg * 4), sens: m.sens, stock: 0 });
}));
const recAt = (p, m) => RECORDS[p * MEDS.length + m];
const setDays = (r, d) => { r.stock = Math.round(r.predBase * d); };
RECORDS.forEach((r) => { const x = R(); setDays(r, x < 0.012 ? rnd(8, 13) : x < 0.17 ? rnd(15, 24) : rnd(25, 60)); });

// Scripted demo scenario: Krishnagiri PHC ORS is critical; Salem PHC holds surplus.
const kr = recAt(0, 0); Object.assign(kr, { avg: 110, predBase: 145, safety: 440, stock: 420 });
const salemId = PHCS.find((p) => p.name === 'Salem PHC').id;
const sl = recAt(salemId, 0); Object.assign(sl, { avg: 95, predBase: 98, safety: 380, stock: 3920 });
// Closer districts have no ORS surplus, so Salem is the natural donor.
RECORDS.forEach((r) => { if (r.med === 0 && ['Dharmapuri', 'Kolar', 'Bengaluru Urban'].includes(PHCS[r.phc].district)) setDays(r, rnd(8, 12)); });
const used = new Set([kr.id, sl.id]);
function pick(pool, count, lo, hi) {
  let c = 0;
  while (c < count) {
    const r = recAt(Math.floor(R() * PHCS.length), pool[Math.floor(R() * pool.length)]);
    if (used.has(r.id) || (r.med === 0 && PHCS[r.phc].district === 'Salem')) continue;
    used.add(r.id); setDays(r, rnd(lo, hi)); c++;
  }
}
pick(KEY_IDS, 16, 3.0, 3.4);   // -> 17 critical alerts including Krishnagiri ORS
pick(SENS_IDS, 25, 3.6, 4.8);  // high today, critical under a health emergency
pick(KEY_IDS, 20, 4.8, 7.2);

export const riskOf = (d) => (d < 3.5 ? 'CRITICAL' : d < 7.5 ? 'HIGH' : d < 14 ? 'MODERATE' : 'LOW');

export function evalRec(r, mult, adj) {
  const stock = r.stock + (adj[r.id] || 0);
  const predicted = Math.max(1, Math.round(r.predBase * (1 + (mult - 1) * r.sens)));
  const exactDays = stock / predicted;
  const p = PHCS[r.phc], m = MEDS[r.med];
  return { id: r.id, phc: r.phc, med: r.med, phcName: p.name, district: p.district, state: p.state, medName: m.name, unit: m.unit, stock, avg: r.avg, predicted, safety: r.safety, exactDays, days: Math.max(0, Math.round(exactDays)), risk: riskOf(exactDays), surplus: Math.max(0, Math.floor((stock - predicted * 10 - r.safety) / 50) * 50) };
}

const rad = (x) => (x * Math.PI) / 180;
const dcache = {};
export function distKm(a, b) {
  const k = a + '|' + b; if (dcache[k]) return dcache[k];
  const A = DMAP[a], B = DMAP[b];
  const h = Math.sin(rad(B.lat - A.lat) / 2) ** 2 + Math.cos(rad(A.lat)) * Math.cos(rad(B.lat)) * Math.sin(rad(B.lon - A.lon) / 2) ** 2;
  return (dcache[k] = Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 1.25)); // x1.25 ~ road factor
}
export const needUnits = (t) => Math.max(100, Math.ceil((t.predicted * 7 - t.stock) / 50) * 50); // restore ~7 days cover

export function donorCandidates(ev, t, n = 3) {
  return ev.filter((d) => d.med === t.med && d.surplus >= 100 && d.district !== t.district)
    .map((d) => ({ ...d, km: distKm(d.district, t.district) })).sort((a, b) => a.km - b.km).slice(0, n);
}

export function buildPlan(ev) {
  const donors = {}; ev.forEach((r) => { if (r.surplus >= 100) (donors[r.med] ||= []).push(r); });
  const left = {};
  const targets = ev.filter((r) => r.risk === 'CRITICAL' || r.risk === 'HIGH').sort((a, b) => a.exactDays - b.exactDays);
  const out = [];
  for (const t of targets) {
    const need = needUnits(t);
    const c = (donors[t.med] || []).filter((d) => d.district !== t.district && (left[d.id] ?? d.surplus) >= 100)
      .map((d) => ({ d, km: distKm(d.district, t.district) })).sort((a, b) => a.km - b.km)[0];
    if (!c) continue;
    const avail = left[c.d.id] ?? c.d.surplus, qty = Math.min(need, avail);
    left[c.d.id] = avail - qty;
    out.push({ target: t, donor: c.d, qty, km: c.km, etaHrs: Math.round(c.km / 45 + 6), newDays: (t.stock + qty) / t.predicted });
  }
  return out;
}

export function kpisOf(ev, mult) {
  let critical = 0, high = 0;
  ev.forEach((r) => { if (r.risk === 'CRITICAL') critical++; else if (r.risk === 'HIGH') high++; });
  return { phcs: PHCS.length, meds: MEDS.length, critical, high, beds: Math.round(1284 * (1 - (mult - 1) * 0.5)), patients: Math.round(8642 * mult) };
}
export const statusOf = (critical) => (critical <= 25 ? 'NORMAL' : critical <= 32 ? 'ELEVATED PRESSURE' : 'CRITICAL STOCK PRESSURE');

export function worstByPhc(ev) {
  const w = new Array(PHCS.length);
  ev.forEach((r) => { if (!w[r.phc] || r.exactDays < w[r.phc].exactDays) w[r.phc] = r; });
  return w;
}
export function medTotals(ev) {
  const t = MEDS.map((m) => ({ ...m, stock: 0, avg: 0, predicted: 0, safety: 0, critical: 0, high: 0 }));
  ev.forEach((r) => { const x = t[r.med]; x.stock += r.stock; x.avg += r.avg; x.predicted += r.predicted; x.safety += r.safety; if (r.risk === 'CRITICAL') x.critical++; else if (r.risk === 'HIGH') x.high++; });
  t.forEach((x) => { x.exactDays = x.stock / x.predicted; x.days = Math.round(x.exactDays); x.risk = riskOf(x.exactDays); });
  return t;
}
export function districtRisk(ev) {
  const m = {}; DISTRICTS.forEach((d) => (m[d.name] = { name: d.name, critical: 0, high: 0 }));
  ev.forEach((r) => { if (r.risk === 'CRITICAL') m[r.district].critical++; else if (r.risk === 'HIGH') m[r.district].high++; });
  return Object.values(m).sort((a, b) => b.critical * 2 + b.high - (a.critical * 2 + a.high)).slice(0, 10);
}
export function stateSummary(ev) {
  return STATE_LIST.map((s) => {
    const ph = PHCS.filter((p) => p.state === s);
    const rs = ev.filter((r) => r.state === s);
    return { state: s, districts: DISTRICTS.filter((d) => d.state === s).length, phcs: ph.length, beds: ph.reduce((a, p) => a + p.beds, 0), attendance: Math.round((ph.reduce((a, p) => a + p.present, 0) / ph.reduce((a, p) => a + p.staff, 0)) * 100), critical: rs.filter((r) => r.risk === 'CRITICAL').length, high: rs.filter((r) => r.risk === 'HIGH').length };
  });
}
export function demandSeries(ev, medId) {
  let avg = 0, pred = 0; ev.forEach((r) => { if (r.med === medId) { avg += r.avg; pred += r.predicted; } });
  const out = [];
  for (let i = 0; i < 14; i++) out.push({ label: i === 13 ? 'Today' : `D-${13 - i}`, actual: Math.round(avg * (1 + 0.05 * Math.sin(i * 1.1) - 0.012 * (13 - i))), forecast: i === 13 ? Math.round(avg) : null });
  for (let k = 1; k <= 7; k++) out.push({ label: `D+${k}`, actual: null, forecast: Math.round(avg + (pred - avg) * Math.min(1, k / 3) + pred * 0.004 * k) });
  out[13].actual = Math.round(avg);
  return out;
}
export function footfallSeries(mult) {
  const f = (i) => 1 + 0.06 * Math.sin(0.9 * i), out = [];
  for (let i = 0; i < 14; i++) out.push({ label: i === 13 ? 'Today' : `D-${13 - i}`, actual: Math.round((8642 * f(i)) / f(13) * (i === 13 ? mult : 1)), forecast: i === 13 ? Math.round(8642 * mult) : null });
  for (let k = 1; k <= 6; k++) out.push({ label: `D+${k}`, actual: null, forecast: Math.round(8642 * (mult > 1 ? mult * (1 + 0.02 * k) : 1 + 0.015 * Math.sin(k))) });
  return out;
}
