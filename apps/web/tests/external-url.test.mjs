import assert from "node:assert/strict";
import test from "node:test";
import { isSafeExternalUrl, safeExternalUrl } from "../src/lib/security/external-url.mjs";

test("allows public HTTP detail pages", () => {
  assert.equal(isSafeExternalUrl("https://earthquake.usgs.gov/earthquakes/eventpage/us7000test"), true);
  assert.equal(safeExternalUrl("http://example.org/advisory/123"), "http://example.org/advisory/123");
});

test("rejects unsafe schemes, credentials, malformed and empty URLs", () => {
  for (const value of ["", "not a url", "javascript:alert(1)", "data:text/plain,test", "file:///tmp/test", "https://user:pass@example.org/page"]) assert.equal(isSafeExternalUrl(value), false, value);
});

test("rejects asset and feed-internal URLs", () => {
  for (const value of ["https://example.org/app.js?v=1", "https://example.org/site.css", "https://example.org/image.webp", "https://example.org/document.pdf", "https://example.org/data.json", "https://example.org/feed/news.xml", "https://example.org/rss/latest"]) assert.equal(isSafeExternalUrl(value), false, value);
});
