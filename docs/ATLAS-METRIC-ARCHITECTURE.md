# ATLAS Metric Architecture Review

**Audit date:** 2026-07-22  
**Decision:** ATLAS may calculate first-party metrics only when they are understandable, reproducible, calibrated, legally derived and accompanied by confidence/coverage. No outside branded composite should be copied.

## Executive decision

The master correctly keeps computed metrics internal, but it overstates readiness and uses names that users may interpret as objective global truths. Metrics must be introduced as **versioned analytical models**, not dashboard decoration. Numerical scores require a published definition, point-in-time inputs, uncertainty, backtests, stability analysis, failure thresholds and an explanation of what the score does not measure.

Recommended sequence:

1. Disaster Pressure Index
2. Cyber Threat Index
3. Market Stress Index
4. Climate Stress Index
5. Technology Activity Index (renamed)
6. Official Attention Index (renamed)
7. Global Risk Composite only after domain validation
8. Planet Pulse/Planet Health only after user research clarifies their purpose
9. Human Concern/Earth Mood, Fear and Greed only if terminology and measurement validity survive research

## Metric decisions

| Metric | Should exist? | ATLAS calculate? | External values? | Internal? | User comprehension | Enterprise trust | Confidence? | Verdict |
|---|---|---|---|---|---|---|---|---|
| Planet Pulse | Maybe, as activity/velocity summary | Yes, if renamed/defined | Inputs only; no external composite | Yes | Low: “pulse” is vague | Low until tied to domain changes | Mandatory | **Research; define as activity, not risk** |
| Planet Health | Maybe, but likely a domain dashboard rather than one number | Yes only with explicit environmental/public-health scope | Inputs only | Yes | Medium, but invites moral/medical overclaim | Low without baselines and coverage | Mandatory | **Research; consider scorecard instead of scalar** |
| Earth Mood | No in current form | Do not calculate “mood” from official news | Never copy sentiment index | N/A | Misleading anthropomorphism | Very low | Would not cure construct invalidity | **Reject/rename to Official Attention or Concern Signals** |
| Human Concern Index | Maybe as a clearly bounded proxy | Yes after multilingual/public-attention data and bias study | External observations allowed, not external composite | Yes | Medium if labeled proxy | Low-medium after validation | Mandatory | **Research; never claim human emotion** |
| Global Risk | Yes as an executive composite, last | Yes | Domain inputs only | Yes | High conceptually; weights need explanation | Medium-high only with domain drill-down | Mandatory, plus domain coverage | **Keep, build last** |
| Fear Index | Questionable | Only as market downside-stress factor; rename | Do not use CNN/Alternative.me value | Yes | Brand-confusable/emotional | Low without clear scope | Mandatory | **Rename “Risk-Off Pressure” or omit** |
| Greed Index | Questionable | Only as risk-appetite factor; rename | Do not use branded values | Yes | Normative and vague | Low | Mandatory | **Rename “Risk Appetite” or omit** |
| Attention Index | Yes with bounded name | Yes | Use lawful source counts/search signals, not a copied score | Yes | Medium-high if “Official Attention” | Medium after bias disclosure | Mandatory | **Keep as Official Attention Index** |
| Technology Index | Yes only as multi-dimensional activity | Yes | Source events and research/release data | Yes | “Technology Index” too broad | Medium if split into activity/risk/adoption | Mandatory | **Rename Technology Activity Index; publish subdimensions** |
| Climate Stress | Yes | Yes | External observations/baselines, no copied composite | Yes | High with regional drill-down | Medium-high after scientific review | Mandatory | **Keep; daily/monthly dual timescales** |
| Disaster Pressure | Yes | Yes | Authoritative hazards and exposure inputs | Yes | High | High if every contributor is traceable | Mandatory | **Best first metric** |
| Cyber Threat | Yes with careful scope | Yes | Use KEV/CVE/NVD/CERT facts; external scores only as attributed features if licensed | Yes | High | Medium-high; prevalence remains uncertain | Mandatory | **Second metric; exploitation dominates CVSS** |
| Market Stress | Yes | Yes | Licensed raw market values; no third-party composite | Yes | High | High if instrument universe/latency disclosed | Mandatory | **Keep after entitlements** |

## Required metric contract

`AtlasMetric` is insufficient. A production `MetricDefinition`/`MetricValue` contract must include:

- stable metric ID, human name, scope and non-goals;
- semantic version and methodology URL;
- value, unit/scale, directionality and band thresholds;
- calculation timestamp, valid time and “as-of” data cutoff;
- geographic/domain scope;
- input snapshot IDs and source/dataset versions;
- feature values, weights, transforms, missing-data handling and caps;
- confidence value **and** decomposed coverage/freshness/agreement/model confidence;
- explanation factors/contributions;
- calibration version, evaluation period and known failure modes;
- revision/supersession link;
- legal lineage and export/AI-use permissions;
- status: available, provisional, stale, insufficient-data, suspended, retired;
- owner, approver and next review date.

## Confidence architecture

A single “confidence score” is too opaque. Publish at least:

1. **Coverage:** share of intended geography/domain/instrument universe represented.
2. **Freshness:** input age relative to promised cadence.
3. **Source quality:** authority, reported quality flags and operational health.
4. **Agreement:** consistency among independent sources after correlation control.
5. **Model confidence:** empirical calibration/error for the intended target.
6. **Overall confidence:** conservative aggregation, capped by the weakest required component.

If the metric has no forecast target, call this **data confidence**, not predictive confidence. Confidence must never be inferred by an LLM.

## Calculation principles

- Use rolling, seasonal, region-aware robust baselines; publish baseline window.
- Avoid global event-count bias: detection coverage and population density drive reported counts.
- Cap correlated sources and repeated publications about one underlying event.
- Preserve point-in-time truth; never backtest with later revisions.
- Separate level, change/acceleration and uncertainty.
- Provide domain and regional decompositions; a global scalar without drill-down is not acceptable.
- Do not smooth away official cancellations or missing feeds. Missingness changes confidence, not the observed value silently.
- Use monotonic, explainable transforms initially. Learned weights require held-out evaluation and governance.
- Human review is required for ontology/classifier changes that alter historical scores.

## Metric-specific architecture

### Disaster Pressure Index

Purpose: current burden and acceleration from natural hazards. Inputs: USGS, cyclone authorities, tsunami messages, confirmed/clustered fire incidents, floods, volcano reports, exposure. Use event severity × exposure × persistence × recency, with cross-source deduplication and uncertainty. Update 5–15 minutes. Trust risk: FIRMS detections and GDACS model alerts cannot be counted as confirmed incidents. Launch regionally before globally.

### Cyber Threat Index

Purpose: observable public exploitation/remediation pressure. Inputs: CISA KEV, canonical CVE records, NVD enrichment, CERT/vendor advisories. Exploited evidence and remediation urgency dominate; CVSS alone must not define threat. Update hourly. Major gap: exposed installed base/prevalence. Publish “observable public vulnerability pressure,” not total cyber threat.

### Market Stress Index

Purpose: cross-asset dislocation. Inputs require licensed venue-aware price/volume data. Calculate volatility, drawdown, breadth, correlation regime, dispersion and liquidity proxies. Update 5–15 minutes with market-hours and delay labels. Keep separate regional/asset subindices; never mix real-time and delayed observations invisibly.

### Climate Stress Index

Purpose: persistent anomaly relative to a fixed, versioned climate baseline. Use temperature/precipitation/drought/fire/air-quality/water measures with population/ecosystem exposure. Provide daily fast component and monthly structural component. It is not weather severity and not a climate forecast. Scientific review and baseline versioning are mandatory.

### Official Attention Index

Purpose: measure concentration and velocity of **official publisher attention**, not public emotion. Inputs: allow-listed publications, deduped underlying events, source-normalized cadence, language and geography. Update 30–60 minutes. Publisher diversity and language coverage drive confidence. If search/social data are later licensed, publish them as separate “Public Attention” factors.

### Technology Activity Index

Purpose: first-party verified technology release/research/security activity. Company marketing volume must be normalized and separated from adoption/impact. Use subindices for releases, research, infrastructure, adoption evidence and security incidents. Update daily/hourly. Avoid ranking vendors on their own publishing frequency.

### Global Risk Composite

Purpose: executive roll-up of validated domain indices. It must be the last metric built. Publish domain vector alongside scalar. Weights should reflect explicit user persona/use case; one universal weighting is unjustifiable. Do not incorporate “mood” as risk without demonstrated predictive/informational value.

### Planet Pulse and Planet Health

Prefer scorecards over single numbers. Planet Pulse can show activity level/change across domains. Planet Health can show climate, air, health and ecosystem subdimensions. If scalars remain, each requires independent user comprehension testing because a stable number can hide severe regional harm.

## Enterprise trust requirements

- Public methodology and version history.
- Reproducible computation from immutable, lawful snapshots.
- Domain expert sign-off and independent review.
- Point-in-time backtesting and calibration.
- Data quality SLOs, incident log and metric suspension control.
- Drill-down from score to factors to records to original provider.
- Region/domain coverage visualization.
- No silent formula changes or history rewriting.
- Clear prohibited uses; no safety, medical or investment decision automation.
- Customer-specific weight profiles must be named configurations, never presented as universal truth.

## LLM role

Allowed: summarize metric factors, explain changes, retrieve cited methodology, draft reports for review. Not allowed: choose numeric scores, invent missing inputs, assign confidence, silently resolve source conflicts, or backfill history. LLM output must cite metric snapshot and evidence records.

## Production gates

1. Input rights allow derivation and intended public/commercial use.
2. Required typed stores and point-in-time snapshots exist.
3. At least 12 months of representative history (more for seasonal/climate metrics).
4. Baseline and simple comparator outperform/validate the proposed method.
5. Coverage and confidence thresholds are tested under source outages.
6. Users can correctly explain the score in comprehension testing.
7. Enterprise reviewers accept methodology, lineage and revision behavior.
8. Shadow mode runs through material events without critical failure.
9. Metric has an owner, incident policy, rollback and retirement procedure.
