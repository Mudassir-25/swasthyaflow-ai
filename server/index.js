import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import { demoAnalysis, demoPlan, demoTranslate, riskFromDays } from './demo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const KEY = (process.env.GEMINI_API_KEY || '').trim();
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const LIVE = Boolean(KEY) && KEY !== 'your_key_here';
// The key lives only on the server. It is never sent to the browser.
const ai = LIVE ? new GoogleGenAI({ apiKey: KEY }) : null;

const app = express();
app.use(express.json({ limit: '200kb' }));

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const str = (v) => String(v ?? '').slice(0, 80);
const SYSTEM = 'You are the supply-chain analyst inside SwasthyaFlow AI, a prototype that helps Indian public-health administrators prevent medicine stock-outs at Primary Health Centres (PHCs). All data is synthetic. Ground every statement in the numbers provided; never invent stock figures or facility names. Be concise and operational. Reply only with JSON matching the schema.';

async function callGemini(prompt, schema) {
  const run = ai.models.generateContent({ model: MODEL, contents: prompt, config: { systemInstruction: SYSTEM, responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 } });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Gemini request timed out')), 30000));
  const res = await Promise.race([run, timeout]);
  return JSON.parse(res.text);
}
// Use Gemini when configured; otherwise (or on failure) fall back to the labelled demo logic.
async function respond(live, demo) {
  if (!ai) return { ...demo(), source: 'demo' };
  try { return { ...(await live()), source: 'gemini', model: MODEL }; }
  catch (e) { console.error('[gemini] failed, using demo fallback:', e.message); return { ...demo(), source: 'demo', geminiError: String(e.message).slice(0, 200) }; }
}

app.get('/api/status', (_req, res) => res.json({ geminiConfigured: LIVE, mode: LIVE ? 'live' : 'demo', model: LIVE ? MODEL : null }));

const analysisSchema = { type: Type.OBJECT, required: ['riskLevel', 'reason', 'predictedDemand', 'estimatedStockoutDays', 'recommendedAction', 'redistributionRecommendation', 'confidence'], properties: {
  riskLevel: { type: Type.STRING, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] }, reason: { type: Type.STRING }, predictedDemand: { type: Type.NUMBER }, estimatedStockoutDays: { type: Type.NUMBER },
  recommendedAction: { type: Type.STRING }, redistributionRecommendation: { type: Type.STRING }, confidence: { type: Type.NUMBER } } };

function cleanDonors(list) {
  return (Array.isArray(list) ? list : []).slice(0, 4).map((d, i) => ({ id: d.id, label: `D${i + 1}`, phc: str(d.phc), district: str(d.district), state: str(d.state), surplus: num(d.surplus), distanceKm: num(d.distanceKm) }));
}

app.post('/api/analyze-supply-risk', async (req, res) => {
  const b = req.body || {};
  if (!b.phc || !b.medicine) return res.status(400).json({ error: 'phc and medicine are required' });
  const input = { phc: str(b.phc), district: str(b.district), medicine: str(b.medicine), unit: str(b.unit) || 'units', currentStock: num(b.currentStock), dailyDemand: num(b.dailyDemand), predictedDemand: num(b.predictedDemand), daysRemaining: num(b.daysRemaining), safetyStock: num(b.safetyStock), emergency: b.emergency?.active ? { active: true, footfallIncreasePct: num(b.emergency.footfallIncreasePct) } : { active: false }, donors: cleanDonors(b.donors) };
  const prompt = `Assess stock-out risk for one medicine at one PHC.\nData: ${JSON.stringify(input)}\n\nRules: riskLevel is CRITICAL if stock lasts under 3.5 days at predictedDemand, HIGH under 7.5, MODERATE under 14, else LOW. estimatedStockoutDays = currentStock / predictedDemand rounded. In "reason" explain the demand-vs-consumption gap (percent) and the runway against safety stock, and mention the emergency surge if active. "recommendedAction" is one operational step. "redistributionRecommendation" must only reference donors listed in the data (or say none is available). confidence is 0-1 and should drop when the demand uplift is large or data is thin.`;
  const out = await respond(async () => {
    const r = await callGemini(prompt, analysisSchema);
    return { riskLevel: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(r.riskLevel) ? r.riskLevel : riskFromDays(input.currentStock / Math.max(1, input.predictedDemand)), reason: String(r.reason), predictedDemand: num(r.predictedDemand, input.predictedDemand), estimatedStockoutDays: num(r.estimatedStockoutDays, input.daysRemaining), recommendedAction: String(r.recommendedAction), redistributionRecommendation: String(r.redistributionRecommendation), confidence: Math.min(1, Math.max(0, num(r.confidence, 0.7))) };
  }, () => demoAnalysis({ ...input, donors: input.donors.map((d) => ({ ...d })) }));
  res.json(out);
});

const planSchema = { type: Type.OBJECT, required: ['donorLabel', 'transferQty', 'priority', 'etaHours', 'rationale', 'riskIfNoAction'], properties: {
  donorLabel: { type: Type.STRING, enum: ['D1', 'D2', 'D3', 'D4', 'NONE'] }, transferQty: { type: Type.INTEGER }, priority: { type: Type.STRING, enum: ['P1', 'P2', 'P3'] },
  etaHours: { type: Type.NUMBER }, rationale: { type: Type.STRING }, riskIfNoAction: { type: Type.STRING } } };

app.post('/api/redistribution-plan', async (req, res) => {
  const b = req.body || {}, t = b.target || {};
  if (!t.phc || !t.medicine) return res.status(400).json({ error: 'target.phc and target.medicine are required' });
  const target = { phc: str(t.phc), district: str(t.district), medicine: str(t.medicine), unit: str(t.unit) || 'units', currentStock: num(t.currentStock), predictedDemand: num(t.predictedDemand), daysRemaining: num(t.daysRemaining), safetyStock: num(t.safetyStock) };
  const donors = cleanDonors(b.donors), need = Math.max(0, Math.round(num(b.need))), emergency = b.emergency?.active ? { active: true, footfallIncreasePct: num(b.emergency.footfallIncreasePct) } : { active: false };
  const prompt = `Recommend ONE cross-district transfer to protect a PHC from a stock-out.\nTarget: ${JSON.stringify(target)}\nUnits needed to restore about 7 days of cover: ${need}\nCandidate donors (each keeps 10 days of its own cover after donating; "surplus" is the maximum it can give): ${JSON.stringify(donors)}\nEmergency context: ${JSON.stringify(emergency)}\n\nChoose the donor that best balances distance, spare surplus and delivery speed. transferQty must not exceed the chosen donor's surplus and should cover the need where possible. priority: P1 if stock lasts under 3.5 days, P2 under 7.5, else P3. If no donor fits, use donorLabel NONE and quantity 0. etaHours is realistic road transfer time.`;
  const shape = (r) => {
    const d = donors.find((x) => x.label === r.donorLabel);
    const qty = d ? Math.max(0, Math.min(Math.round(num(r.transferQty)), d.surplus)) : 0; // server-side guardrail: never exceed donor surplus
    return { donorId: d ? d.id : null, fromPhc: d?.phc ?? null, fromDistrict: d?.district ?? null, distanceKm: d?.distanceKm ?? null, toPhc: target.phc, medicine: target.medicine, unit: target.unit, transferQty: qty, priority: ['P1', 'P2', 'P3'].includes(r.priority) ? r.priority : 'P1', etaHours: num(r.etaHours), rationale: String(r.rationale), riskIfNoAction: String(r.riskIfNoAction), expectedDaysAfterTransfer: +((target.currentStock + qty) / Math.max(1, target.predictedDemand)).toFixed(1) };
  };
  const out = await respond(async () => shape(await callGemini(prompt, planSchema)), () => shape(demoPlan({ target, donors, need, emergency })));
  res.json(out);
});

const translateSchema = { type: Type.OBJECT, required: ['translations'], properties: { translations: { type: Type.ARRAY, items: { type: Type.STRING } } } };
const LANGS = { hi: 'Hindi', kn: 'Kannada', ta: 'Tamil' };
app.post('/api/translate', async (req, res) => {
  const { items, targetLanguage } = req.body || {};
  if (!LANGS[targetLanguage] || !Array.isArray(items) || !items.length || items.length > 12) return res.status(400).json({ error: 'items[] (max 12) and targetLanguage (hi|kn|ta) are required' });
  const clean = items.map((i) => ({ text: String(i.text ?? '').slice(0, 600), template: i.template ? { phc: str(i.template.phc), medicine: str(i.template.medicine), days: num(i.template.days) } : undefined }));
  const prompt = `Translate each English public-health alert into ${LANGS[targetLanguage]}. Keep facility names, medicine names and numbers unchanged (transliterating facility names is optional). Use plain, respectful language suitable for a health worker. Return {"translations": [...]} with exactly ${clean.length} strings in the same order.\n${JSON.stringify(clean.map((c) => c.text))}`;
  const out = await respond(async () => {
    const r = await callGemini(prompt, translateSchema);
    if (!Array.isArray(r.translations) || r.translations.length !== clean.length) throw new Error('bad translation shape');
    return { translations: r.translations.map(String), translated: true };
  }, () => { const d = demoTranslate(clean, targetLanguage); return { translations: d.map((x) => x.text), translated: d.every((x) => x.translated) }; });
  res.json(out);
});

const dist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.listen(PORT, () => console.log(`SwasthyaFlow AI API on http://localhost:${PORT}  |  ${LIVE ? `Gemini LIVE (${MODEL})` : 'DEMO MODE (no GEMINI_API_KEY)'}`));
