export const SENTIMENT_LEXICON_ID = "atlas-official-text-en";
export const SENTIMENT_LEXICON_VERSION = "1.0.0";

// Reviewed for literal use in official reports/advisories. Ambiguous emotion words,
// political terms, provider names, locations, and the word "safe" are intentionally absent.
export const SENTIMENT_LEXICON = Object.freeze({
  positive: Object.freeze({
    improved: 1, improving: 1, stable: 1, stabilized: 1, recovered: 1,
    recovery: 1, successful: 1, successfully: 1, normal: 1, operational: 1,
    favorable: 1, resolved: 1, restored: 1, progress: 1, protected: 1,
  }),
  strongPositive: Object.freeze({
    breakthrough: 2, exceptional: 2, excellent: 2, rescued: 2,
  }),
  negative: Object.freeze({
    damage: -1, damaged: -1, disrupted: -1, disruption: -1, warning: -1,
    warnings: -1, severe: -1, critical: -1, failure: -1, failed: -1,
    hazardous: -1, emergency: -1, threat: -1, threats: -1, loss: -1,
    losses: -1, outage: -1, delayed: -1, delay: -1, flooding: -1,
  }),
  strongNegative: Object.freeze({
    catastrophic: -2, deadly: -2, devastating: -2, fatalities: -2,
    fatality: -2, destroyed: -2, destruction: -2,
  }),
  intensifiers: Object.freeze(["extremely", "highly", "major", "very"]),
  negations: Object.freeze(["never", "no", "not", "without"]),
});
