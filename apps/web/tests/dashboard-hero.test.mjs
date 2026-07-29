import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  BREAKING_WINDOW_MS,
  isBreakingHeroEvent,
  selectDashboardHeroEvent,
} from "../src/lib/dashboard-hero-logic.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const component = await read("../src/components/dashboard/BreakingHero.tsx");
const dashboard = await read("../src/components/dashboard/AtlasDashboard.tsx");
const css = await read("../src/app/app/dashboard.css");
const english = await read("../src/lib/i18n/messages/en.ts");
const thai = await read("../src/lib/i18n/messages/th.ts");
const dashboardRoute = await read("../src/app/api/dashboard/route.ts");

function event(overrides = {}) {
  return {
    id: "event:base",
    title: "Canonical provider title",
    summary: "Canonical provider summary",
    severity: "info",
    occurredAt: "2026-07-28T10:00:00.000Z",
    sourceName: "Canonical Provider",
    sourceUrl: "https://official.example/event",
    metadata: {},
    ...overrides,
  };
}

test("critical verified event is selected over lower severities", () => {
  const selected = selectDashboardHeroEvent([
    event({ id: "high", severity: "high" }),
    event({ id: "critical", severity: "critical", occurredAt: "2026-07-27T00:00:00.000Z" }),
  ]);
  assert.equal(selected.id, "critical");
});

test("high-impact event is selected when no critical event exists", () => {
  const selected = selectDashboardHeroEvent([
    event({ id: "moderate", severity: "moderate" }),
    event({ id: "high", severity: "high" }),
  ]);
  assert.equal(selected.id, "high");
});

test("recency and stable ID deterministically order equal severity events", () => {
  assert.equal(selectDashboardHeroEvent([
    event({ id: "older", severity: "moderate", occurredAt: "2026-07-27T00:00:00.000Z" }),
    event({ id: "newer", severity: "moderate", occurredAt: "2026-07-28T00:00:00.000Z" }),
  ]).id, "newer");
  assert.equal(selectDashboardHeroEvent([
    event({ id: "z", severity: "low" }),
    event({ id: "a", severity: "low" }),
  ]).id, "a");
});

test("monitoring fallback and no-event state are deterministic", () => {
  assert.equal(selectDashboardHeroEvent([
    event({ id: "unknown", severity: "unknown" }),
    event({ id: "info", severity: "info" }),
  ]).id, "info");
  assert.equal(selectDashboardHeroEvent([]), null);
  assert.match(component, /HeroEmptyState/);
  assert.match(english, /No verified priority event available/);
});

test("breaking label is limited to recent critical or high-impact events", () => {
  const snapshotAt = "2026-07-29T00:00:00.000Z";
  assert.equal(BREAKING_WINDOW_MS, 86_400_000);
  assert.equal(isBreakingHeroEvent(event({ severity: "critical", occurredAt: "2026-07-28T00:00:00.000Z" }), snapshotAt), true);
  assert.equal(isBreakingHeroEvent(event({ severity: "high", occurredAt: "2026-07-28T12:00:00.000Z" }), snapshotAt), true);
  assert.equal(isBreakingHeroEvent(event({ severity: "moderate", occurredAt: "2026-07-28T23:00:00.000Z" }), snapshotAt), false);
  assert.equal(isBreakingHeroEvent(event({ severity: "critical", occurredAt: "2026-07-27T23:59:59.000Z" }), snapshotAt), false);
  assert.equal(isBreakingHeroEvent(event({ severity: "critical", occurredAt: "2026-07-30T00:00:00.000Z" }), snapshotAt), false);
});

test("safe eligible evidence projection is displayed with attribution", () => {
  assert.match(dashboard, /snapshot\.evidenceMedia\?\.\[heroEvent\.id\]/);
  assert.match(component, /HERO_MEDIA_TYPES\.has\(media\.mediaType\)/);
  assert.match(component, /media\.attribution/);
  assert.match(component, /media\.licenseSummary/);
  assert.match(component, /alt=\{media\.caption\}/);
  assert.doesNotMatch(component, /event\.metadata.*(?:image|media)/s);
});

test("no-media layout is safe and introduces no fabricated fallback", () => {
  assert.match(component, /mediaUrl \? " has-media" : " no-media"/);
  assert.match(css, /\.intelligence-hero\.no-media/);
  assert.doesNotMatch(component + css, /placeholder(?:-image|\.jpg)|fallback-image/i);
});

test("official source appears only after URL validation", () => {
  assert.match(component, /const sourceUrl = safeExternalUrl\(event\.sourceUrl\)/);
  assert.match(component, /\{sourceUrl \? <a href=\{sourceUrl\}[^}]+hero\.officialSource/s);
});

test("canonical title, provider, and severity remain unchanged", () => {
  assert.match(component, /<h1>\{event\.title\}<\/h1>/);
  assert.match(component, /<dd>\{event\.sourceName\}<\/dd>/);
  assert.match(component, /severity-\$\{event\.severity\}/);
  const original = event({ severity: "critical" });
  selectDashboardHeroEvent([original]);
  assert.equal(original.title, "Canonical provider title");
  assert.equal(original.sourceName, "Canonical Provider");
  assert.equal(original.severity, "critical");
});

test("English and Thai hero labels exist with key parity", () => {
  for (const key of ["breaking", "topIntelligence", "viewEvidence", "viewDetails", "officialSource", "verifiedSource", "latestVerifiedEvent"]) {
    assert.ok(english.includes(`"hero.${key}"`));
    assert.ok(thai.includes(`"hero.${key}"`));
  }
});

test("loading skeleton and keyboard-accessible native links are present", () => {
  assert.match(dashboard, /loading \? <HeroSkeleton \/>/);
  assert.match(component, /aria-busy="true"/);
  assert.match(component, /<Link className="primary"/);
  assert.match(component, /<a href=\{sourceUrl\}/);
  assert.match(css, /\.atlas-v4 a:focus-visible/);
});

test("hero is first dominant content and lower dashboard sections remain", () => {
  const heroIndex = dashboard.indexOf("loading ? <HeroSkeleton");
  for (const section of ["situation-summary", "top-events", "hot-regions", "category-intelligence", "latest-intelligence"]) {
    assert.ok(dashboard.indexOf(section) > heroIndex, `${section} must remain below the hero`);
  }
});

test("mobile hero prevents overflow and uses touch-sized wrapping actions", () => {
  assert.match(css, /\.situation-main\{[^}]*overflow-x:clip/);
  assert.match(css, /@media\(max-width:480px\)[^{]*\{[^]*?\.hero-actions\{display:grid;grid-template-columns:1fr\}/);
  assert.match(css, /\.hero-actions a\{[^}]*min-height:44px/);
  assert.match(css, /overflow-wrap:anywhere/);
});

test("dashboard fetching and public API boundaries remain unchanged", () => {
  assert.match(dashboard, /fetch\("\/api\/dashboard"\)/);
  assert.doesNotMatch(component + dashboard, /\/api\/v1\//);
  assert.match(dashboardRoute, /evidenceMedia/);
});
