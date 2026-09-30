async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}
export const api = {
  status: () => fetch('/api/status').then((r) => r.json()),
  analyze: (b) => post('/api/analyze-supply-risk', b),
  plan: (b) => post('/api/redistribution-plan', b),
  translate: (items, targetLanguage) => post('/api/translate', { items, targetLanguage })
};
