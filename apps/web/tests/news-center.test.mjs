import test from "node:test";
import assert from "node:assert/strict";
import {
  canUseAiSummary,
  filterNewsGroups,
  groupNewsByEvent,
} from "../src/lib/news/news-center-logic.mjs";

const article = (overrides) => ({
  id: "one",
  title: "Asteroid 2026 AB makes close approach to Earth",
  summary: "An official source report.",
  publishedAt: "2026-07-23T10:00:00.000Z",
  sourceId: "jpl-news",
  sourceName: "JPL News",
  sourceUrl: "https://www.jpl.nasa.gov/news/example",
  category: "space",
  ...overrides,
});

test("event groups and reports are newest first", () => {
  const groups = groupNewsByEvent([
    article({ id: "old", title: "Mars rover sends panorama", publishedAt: "2026-07-21T10:00:00.000Z" }),
    article({ id: "new", publishedAt: "2026-07-23T10:00:00.000Z" }),
  ]);

  assert.equal(groups[0].articles[0].id, "new");
  assert.equal(groups[1].articles[0].id, "old");
});

test("related coverage is grouped without removing source attribution", () => {
  const groups = groupNewsByEvent([
    article({ id: "jpl" }),
    article({
      id: "cneos",
      title: "Close approach to Earth by asteroid 2026 AB",
      sourceId: "cneos-news",
      sourceName: "CNEOS News",
    }),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].articles.length, 2);
  assert.equal(groups[0].sourceCount, 2);
});

test("search and category filters inspect report content and source", () => {
  const groups = groupNewsByEvent([
    article({ id: "space" }),
    article({ id: "technology", title: "Flight software update", category: "technology" }),
  ]);

  assert.equal(filterNewsGroups(groups, "CNEOS", "all").length, 0);
  assert.equal(filterNewsGroups(groups, "JPL", "space").length, 1);
  assert.equal(filterNewsGroups(groups, "", "technology").length, 1);
});

test("AI summaries require distinct trusted sources", () => {
  const oneSource = groupNewsByEvent([
    article({ id: "one" }),
    article({ id: "two", title: "Close approach to Earth by asteroid 2026 AB" }),
  ])[0];
  const twoSources = groupNewsByEvent([
    article({ id: "one" }),
    article({
      id: "two",
      title: "Close approach to Earth by asteroid 2026 AB",
      sourceId: "cneos-news",
    }),
  ])[0];

  assert.equal(canUseAiSummary(oneSource, ["jpl-news", "cneos-news"]), false);
  assert.equal(canUseAiSummary(twoSources, ["jpl-news", "cneos-news"]), true);
  assert.equal(canUseAiSummary(twoSources, ["jpl-news"]), false);
});

