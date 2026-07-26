import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  formatDateTimeValue,
  localeFromDevice,
  localeTag,
  relativeTimeParts,
  resolveLocale,
} from "../src/lib/i18n/locale-logic.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const english = await read("../src/lib/i18n/messages/en.ts");
const thai = await read("../src/lib/i18n/messages/th.ts");
const provider = await read("../src/lib/i18n/I18nProvider.tsx");
const switcher = await read("../src/components/i18n/LanguageSwitcher.tsx");
const dashboard = await read("../src/components/dashboard/AtlasDashboard.tsx");
const page = await read("../src/app/app/page.tsx");
const display = await read("../src/lib/i18n/display.ts");
const css = await read("../src/app/app/dashboard.css");

function dictionaryKeys(source) {
  return [...source.matchAll(/^\s{2}"([^"]+)":/gm)].map((match) => match[1]).sort();
}

test("locale resolution uses English fallback and detects Thai or English devices", () => {
  assert.equal(resolveLocale(null, [], ""), "en");
  assert.equal(localeFromDevice(["th-TH", "en-US"], "en-US"), "th");
  assert.equal(localeFromDevice(["en-GB"], "en-GB"), "en");
  assert.equal(localeFromDevice(["fr-FR"], "fr-FR"), "en");
});

test("stored preference wins and invalid storage falls back to device locale", () => {
  assert.equal(resolveLocale("en", ["th-TH"], "th-TH"), "en");
  assert.equal(resolveLocale("th", ["en-US"], "en-US"), "th");
  assert.equal(resolveLocale("invalid", ["th"], "th"), "th");
});

test("English and Thai dictionaries have identical stable keys", () => {
  assert.deepEqual(dictionaryKeys(thai), dictionaryKeys(english));
  assert.match(english, /"dashboard\.globalSituation\.title": "GLOBAL SITUATION NOW"/);
  assert.match(thai, /"dashboard\.globalSituation\.title": "สถานการณ์โลกขณะนี้"/);
});

test("missing localized keys have a deterministic English fallback", async () => {
  const localeLayer = await read("../src/lib/i18n/locale.ts");
  assert.match(localeLayer, /localized\[key\] \?\? fallback\[key\] \?\? key/);
});

test("switcher changes locale in place and persists browser preference", () => {
  assert.match(switcher, /EN/);
  assert.match(switcher, /ไทย/);
  assert.match(switcher, /aria-pressed/);
  assert.match(provider, /localStorage\.setItem\(LOCALE_STORAGE_KEY, nextLocale\)/);
  assert.match(provider, /document\.documentElement\.lang = nextLocale/);
  assert.doesNotMatch(switcher + provider, /location\.(?:href|assign|replace)|reload\(/);
  assert.match(page, /I18nProvider/);
});

test("locale-aware dates use Gregorian Thai and relative time remains deterministic", () => {
  assert.equal(localeTag("en"), "en-US");
  assert.equal(localeTag("th"), "th-TH-u-ca-gregory");
  const instant = "2026-07-27T03:30:00.000Z";
  assert.notEqual(formatDateTimeValue(instant, "en"), formatDateTimeValue(instant, "th"));
  assert.deepEqual(relativeTimeParts("2026-07-27T02:30:00.000Z", Date.parse(instant)), { unit: "hours", count: 1 });
  assert.match(english, /"time\.hoursAgo": "\{count\} hours ago"/);
  assert.match(thai, /"time\.hoursAgo": "\{count\} ชั่วโมงที่แล้ว"/);
});

test("display mappings localize canonical enums without changing their values", () => {
  for (const value of ["CRITICAL", "HIGH_IMPACT", "REGIONAL", "MONITORING", "HEALTHY", "VERIFIED", "EARTHQUAKE", "AI_TECHNOLOGY"]) {
    assert.match(display, new RegExp(`\\b${value}:`));
  }
  assert.doesNotMatch(display, /toLowerCase\(\)|replaceAll\(/);
});

test("dashboard translates its shell while canonical event and provider content stay untouched", () => {
  assert.match(dashboard, /\{event\.title\}/);
  assert.match(dashboard, /\{event\.sourceName\}/);
  assert.match(dashboard, /\{event\.summary/);
  assert.match(dashboard, /t\("dashboard\.topEvents"\)/);
  assert.match(dashboard, /t\("action\.verifySource"\)/);
  assert.doesNotMatch(dashboard, /translate.*event\.(?:title|summary|sourceName)/i);
});

test("language control is visible and touch-sized across responsive dashboard widths", () => {
  assert.match(dashboard, /<LanguageSwitcher \/>/);
  assert.match(css, /\.atlas-language-switcher button\{[^}]*min-width:44px;min-height:44px/);
  assert.match(css, /@media\(max-width:800px\)/);
  assert.match(css, /@media\(max-width:480px\)/);
  assert.match(css, /font-family:"Noto Sans Thai"/);
});

test("/app remains the locale-neutral dashboard URL", () => {
  assert.doesNotMatch(page + provider + switcher, /\/(?:en|th)\/app/);
  assert.match(dashboard, /href="\/app"/);
});
