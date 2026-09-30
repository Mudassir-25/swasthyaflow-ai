// DEMO MODE: deterministic, rule-based responses used only when GEMINI_API_KEY is missing
// (or a Gemini call fails). These are NOT Gemini outputs and are labelled as such in the UI.
export const riskFromDays = (d) => (d < 3.5 ? 'CRITICAL' : d < 7.5 ? 'HIGH' : d < 14 ? 'MODERATE' : 'LOW');

export function demoAnalysis(i) {
  const exact = i.currentStock / Math.max(1, i.predictedDemand);
  const days = Math.max(0, Math.round(exact));
  const risk = riskFromDays(exact);
  const uplift = Math.max(0, Math.round((i.predictedDemand / Math.max(1, i.dailyDemand) - 1) * 100));
  const surge = i.emergency?.active ? ` An emergency footfall surge of about +${i.emergency.footfallIncreasePct}% is included in the projection.` : '';
  const reason = `Projected demand of ${i.predictedDemand} units/day is about ${uplift}% above current consumption (${i.dailyDemand}/day). At this burn rate the ${i.currentStock} units on hand last roughly ${days} day(s)${i.safetyStock ? `, against a safety stock of ${i.safetyStock}` : ''}.${surge}`;
  const action = { CRITICAL: `Escalate today: dispatch a cross-district transfer and pause non-essential dispensing of ${i.medicine} at ${i.phc}.`, HIGH: `Raise an indent this week and pre-position a transfer for ${i.medicine} at ${i.phc}.`, MODERATE: `Monitor daily and include ${i.medicine} in the next scheduled district replenishment.`, LOW: `No action needed; continue routine monitoring.` }[risk];
  const d = i.donors?.[0];
  const redistribution = d ? `Transfer surplus ${i.medicine} from ${d.phc} (${d.district}, about ${d.distanceKm} km away, ${d.surplus} units spare) to ${i.phc}.` : `No cross-district donor with surplus ${i.medicine} was found; request an emergency state-level indent.`;
  return { riskLevel: risk, reason, predictedDemand: i.predictedDemand, estimatedStockoutDays: days, recommendedAction: action, redistributionRecommendation: redistribution, confidence: +(0.7 + Math.min(0.2, uplift / 200)).toFixed(2) };
}

export function demoPlan({ target, donors, need, emergency }) {
  const d = donors[0];
  if (!d) return { donorLabel: null, transferQty: 0, priority: 'P1', etaHours: 0, rationale: `No cross-district donor holds surplus ${target.medicine}. Escalate to a state-level emergency indent.`, riskIfNoAction: `${target.phc} runs out of ${target.medicine} in about ${target.daysRemaining} day(s).` };
  const qty = Math.min(need, d.surplus);
  return {
    donorLabel: d.label, transferQty: qty, priority: target.daysRemaining <= 3 ? 'P1' : 'P2', etaHours: Math.round(d.distanceKm / 45 + 6),
    rationale: `${d.phc} in ${d.district} keeps a surplus of ${d.surplus} units above its 10-day cover, and it is the nearest donor (${d.distanceKm} km). ${target.phc} has elevated projected demand${emergency?.active ? ' during the emergency surge' : ''}.`,
    riskIfNoAction: `Without a transfer, ${target.phc} runs out of ${target.medicine} in about ${target.daysRemaining} day(s) and patients may go untreated.`
  };
}

const T = {
  hi: '{phc} में {medicine} का स्टॉक {days} दिनों में सुरक्षा स्तर से नीचे जा सकता है।',
  kn: '{phc} ಯ {medicine} ಸಂಗ್ರಹವು {days} ದಿನಗಳಲ್ಲಿ ಸುರಕ್ಷತಾ ಮಟ್ಟಕ್ಕಿಂತ ಕೆಳಗೆ ಇಳಿಯಬಹುದು.',
  ta: '{phc}-இல் {medicine} இருப்பு {days} நாட்களில் பாதுகாப்பு அளவுக்குக் கீழே குறையக்கூடும்.'
};
export function demoTranslate(items, lang) {
  return items.map((it) => {
    const t = T[lang];
    if (t && it.template) return { text: t.replace('{phc}', it.template.phc).replace('{medicine}', it.template.medicine).replace('{days}', it.template.days), translated: true };
    return { text: it.text, translated: false };
  });
}
