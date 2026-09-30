import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { RECORDS, evalRec, buildPlan, kpisOf, worstByPhc } from './data.js';
import { api } from './api.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [sim, setSim] = useState(false);
  const [pct, setPct] = useState(40);
  const [lang, setLang] = useState('en');
  const [applied, setApplied] = useState([]);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { api.status().then(setStatus).catch(() => setStatus({ mode: 'demo', geminiConfigured: false, offline: true })); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4500); return () => clearTimeout(t); }, [toast]);

  const adj = useMemo(() => { const a = {}; applied.forEach((x) => { a[x.toId] = (a[x.toId] || 0) + x.qty; a[x.fromId] = (a[x.fromId] || 0) - x.qty; }); return a; }, [applied]);
  const mult = sim ? 1 + pct / 100 : 1;
  const baseEv = useMemo(() => RECORDS.map((r) => evalRec(r, 1, adj)), [adj]);
  const simEv = useMemo(() => RECORDS.map((r) => evalRec(r, 1 + pct / 100, adj)), [adj, pct]);
  const ev = sim ? simEv : baseEv;
  const kpis = useMemo(() => kpisOf(ev, mult), [ev, mult]);
  const baseKpis = useMemo(() => kpisOf(baseEv, 1), [baseEv]);
  const simKpis = useMemo(() => kpisOf(simEv, 1 + pct / 100), [simEv, pct]);
  const plan = useMemo(() => buildPlan(ev), [ev]);
  const worst = useMemo(() => worstByPhc(ev), [ev]);
  const top = useMemo(() => { let t = null; ev.forEach((r) => { if (!t || r.exactDays < t.exactDays) t = r; }); return t; }, [ev]);

  const go = useCallback((p, recId) => { setPage(p); if (recId != null) setSelected(recId); window.scrollTo({ top: 0 }); }, []);
  const approve = useCallback((t) => {
    setApplied((a) => [...a, { ...t, at: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), n: a.length + 1 }]);
    setToast(`Transfer approved: ${t.qty.toLocaleString('en-IN')} ${t.medName} from ${t.fromName} to ${t.toName}`);
  }, []);
  const reset = useCallback(() => { setApplied([]); setSim(false); setSelected(null); setToast('Demo data reset'); }, []);

  const value = { status, page, go, sim, setSim, pct, setPct, lang, setLang, applied, approve, reset, selected, setSelected, toast, mult, baseEv, simEv, ev, kpis, baseKpis, simKpis, plan, worst, top };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
