import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(
  new URL("../src/app/app/dashboard.css", import.meta.url),
  "utf8",
);

test("app document and desktop dashboard preserve vertical document scrolling", () => {
  const rootRule = css.match(/html,\s*body\s*\{([^}]+)\}/)?.[1] ?? "";
  const dashboardRule = css.match(/\.atlas-v4-main\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.doesNotMatch(rootRule, /overflow:\s*hidden/);
  assert.doesNotMatch(rootRule, /(?:^|;)\s*height:\s*100%/);
  assert.match(rootRule, /overflow-x:\s*clip/);
  assert.doesNotMatch(dashboardRule, /(?:^|;)\s*height:\s*100dvh/);
  assert.doesNotMatch(dashboardRule, /overflow:\s*hidden/);
  assert.match(dashboardRule, /min-height:\s*100dvh/);
  assert.match(dashboardRule, /minmax\(520px,\s*1fr\)/);
});

test("metrics, graph, and timeline use minimum viewport height without fixed page height", () => {
  for (const className of ["metrics-page", "event-graph-page", "global-timeline-page"]) {
    const rule = css.match(new RegExp(`\\.${className}\\s*\\{([^}]+)\\}`))?.[1] ?? "";
    assert.match(rule, /min-height:\s*100dvh/);
    assert.doesNotMatch(rule, /(?:^|;)\s*height:\s*100dvh/);
    assert.doesNotMatch(rule, /overflow-y:\s*hidden/);
  }
});

test("normal mobile mode restores auto vertical scrolling and clips horizontal overflow", () => {
  const mobileBlock = css.match(/@media \(max-width:\s*1179px\)\s*\{\s*html,\s*body\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(mobileBlock, /height:\s*auto/);
  assert.match(mobileBlock, /overflow-x:\s*hidden/);
  assert.match(mobileBlock, /overflow-y:\s*auto/);
});
