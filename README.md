# SwasthyaFlow AI

**Predict shortages. Move resources before patients are affected.**

> Prototype — Synthetic Demonstration Data. Nothing in this repository comes from real government PHCs.

Built for **Build with AI: Code for Communities (Second Edition), Track 03: Smart Health & Supply Chain Resilience**.

## 1. Problem
Public healthcare in India depends on a very large network of Primary Health Centres (PHCs). Without real-time visibility of medicine stock, patient footfall, beds and staff attendance, PHCs run out of essential medicines such as ORS, IV fluids and antibiotics, and the system reacts too late during outbreaks, floods and heat waves.

## 2. Solution
SwasthyaFlow AI gives health administrators one operations view of the PHC network. It forecasts medicine demand, warns of stock-outs days ahead, and recommends cross-district transfers from PHCs with surplus to PHCs under pressure. Google Gemini reasons over the numbers and returns structured, validated recommendations. The admin approves a transfer and the risk state updates immediately.

## 3. Features
- **Dashboard**: KPI cards (248 PHCs, 42 medicines, 17 critical alerts, 1,284 beds, 8,642 patients today), four charts (demand with forecast, stock cover, footfall, district risk) and a sortable PHC table.
- **AI Supply Chain Command Center**: the single most urgent stock-out, with a stock runway bar, a recommended transfer and a **Generate AI Redistribution Plan** button.
- **Medicine Inventory**: all 42 medicines with stock, daily consumption, predicted demand, days remaining, safety stock and risk; drill into the PHCs closest to a stock-out.
- **AI Risk Monitor**: alert list plus per-alert Gemini risk analysis (risk level, reason, action, redistribution, confidence).
- **Redistribution**: greedy nearest-donor transfer plan with **Approve** actions and an action log.
- **PHC Network**: federated architecture visual, state roll-up (including staff attendance) and PHC directory.
- **Emergency Simulation**: +30–50% footfall, before/after comparison, AI analysis of the changed situation.
- **Multilingual**: English, Hindi, Kannada, Tamil advisories.
- **DEMO MODE**: full app works with no API key.

## 4. Architecture
```
Browser (React + Vite + Recharts)
   │  /api/*
Express server ──► Google Gemini (official @google/genai SDK), key kept server-side
   │
Synthetic data (src/data.js, seeded, deterministic)
```
- The frontend computes the deterministic forecast, days-remaining and risk from the synthetic dataset, so the dashboard is populated on first load.
- The server exposes three endpoints: `POST /api/analyze-supply-risk`, `POST /api/redistribution-plan`, `POST /api/translate`, plus `GET /api/status`.
- The federated concept is shown on the **PHC Network** page: PHC → District → State → National Health Intelligence Layer. Raw operational data stays with the district or state; only standardised risk scores, forecast features and model outputs move up. **No nationwide infrastructure is implemented.**

## 5. Gemini AI integration
- Official SDK: `@google/genai`, model `gemini-3.5-flash-lite` by default (`GEMINI_MODEL` to change).
- The API key is read from `GEMINI_API_KEY` **on the server only**. The browser never sees it.
- Responses use JSON mode with a response schema. Example output of `/api/analyze-supply-risk`:
```json
{ "riskLevel": "CRITICAL", "reason": "...", "predictedDemand": 145, "estimatedStockoutDays": 3,
  "recommendedAction": "...", "redistributionRecommendation": "...", "confidence": 0.86 }
```
- Gemini does real reasoning: it weighs demand uplift against safety stock, and for redistribution it **chooses among candidate donors** (distance, spare surplus, delivery time) and sets the quantity.
- Guardrails: donor choice is restricted to the candidates supplied, the transfer quantity is clamped to the donor's surplus on the server, and "days after transfer" is recomputed server-side rather than trusted from the model.
- Translation of alerts into Hindi, Kannada and Tamil also uses Gemini.
- If a Gemini call fails, the server falls back to the labelled demo logic and the UI shows "DEMO response · not Gemini (Gemini call failed)".

**DEMO MODE** (no key): the badge in the top bar says DEMO MODE, the AI panels use deterministic rule-based responses labelled "DEMO response · not Gemini", and alert translation uses fixed templates for the standard alert sentence. Free-text translation needs Gemini.

## 6. Emergency simulation
Press **Simulate Health Emergency** (top bar or the Emergency Simulation page). Footfall rises by the chosen 30–50% and each medicine's demand rises by an emergency sensitivity (ORS 1.25, IV fluids 1.2, paracetamol 1.1, insulin 0.15, and so on). Demand, days remaining, risk and the redistribution plan are all recalculated. With the default +40%: critical alerts go from 17 to about 41, the network status changes from NORMAL to CRITICAL STOCK PRESSURE, and the plan grows to about 100 transfers. Then click **Generate AI Redistribution Plan** to have Gemini analyse the changed situation.

## 7. Synthetic data disclaimer
All PHCs, stock levels, patients, beds and attendance are generated by a seeded script (`src/data.js`) using realistic Indian district names. The "Krishnagiri PHC / ORS / Salem PHC" scenario is scripted for the demo. The data does not describe any real facility. The UI carries the label "Prototype — Synthetic Demonstration Data".

## 8. Local setup
Requires Node.js 18+.
```bash
npm install
cp .env.example .env        # optional: add your key to use Gemini
npm run dev                 # web on http://localhost:5173, API on :8787
```
Production-style run:
```bash
npm run build
npm start                   # serves the built app and API on http://localhost:8787
```
Data self-check: `npm run test:data` (verifies the KPI numbers and the Krishnagiri → Salem scenario).

## 9. Environment variables
```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.5-flash-lite   # optional
PORT=8787                       # optional
```
Never commit a real key. `.env` is git-ignored.

## 10. Deployment
Any Node host works. Google Cloud Run example (a `Dockerfile` is included):
```bash
gcloud run deploy swasthyaflow-ai --source . --region asia-south1 --allow-unauthenticated \
  --set-env-vars GEMINI_MODEL=gemini-3.5-flash-lite
# store the key as a secret rather than a plain variable:
gcloud run services update swasthyaflow-ai --region asia-south1 \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```
Other hosts (Render, Railway, Fly.io): build command `npm install && npm run build`, start command `npm start`, and set `GEMINI_API_KEY` in the host's secret settings.

## 11. How it scales across India
- **Data stays local.** Each district and state keeps its own operational store; the national layer only receives standardised risk scores, aggregated demand features and model outputs, matching federated-learning practice.
- **Same schema everywhere.** A PHC–medicine stock line (stock, daily consumption, predicted demand, safety stock) is the only unit of exchange, so any state can plug in.
- **Hierarchical redistribution.** Transfers are matched within a district first, then across districts, then across states; the donor and target logic is the same at each tier.
- **Cheap to run.** The AI is called only for the alerts an administrator opens, not for all ~10,000 stock lines, so cost grows with alerts and not with network size.
- **Language access.** Alerts can be issued in local languages for PHC staff.
- Production would replace the synthetic dataset with a state HMIS or e-Aushadhi integration and add authentication and audit trails.

## 12. Mapping to Track 03
| Track requirement | Where it is in the app |
|---|---|
| Visibility of medicine stocks | Dashboard, Medicine Inventory |
| Bed availability | KPI card, PHC Network |
| Personnel attendance | PHC Network (state roll-up and directory) |
| Patient / footfall trends | Footfall chart, PHC table |
| Forecast medicine demand | Demand chart with 7-day forecast, predicted demand columns |
| Early warnings for stock-outs during emergencies | Command Center, AI Risk Monitor, Emergency Simulation |
| Automated cross-district redistribution | Redistribution page, AI Redistribution Plan, Approve action |
| Scalable, federated deployment across India | PHC Network architecture and section 11 |

## Project layout
```
server/   index.js (Express + Gemini), demo.js (labelled demo fallback)
src/      data.js (synthetic data + risk engine), store.jsx, CommandCenter.jsx, pages/
scripts/  selftest.mjs
```
