import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("dashboard dialogs expose semantics and Escape close behavior", async () => {
  const source = await readFile(new URL("../src/components/dashboard/DashboardModal.tsx", import.meta.url), "utf8");
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /event\.key === "Escape"/);
});

test("earthquake API returns an explicit error without a mock FeatureCollection", async () => {
  const source = await readFile(new URL("../src/app/api/earthquakes/route.ts", import.meta.url), "utf8");
  assert.match(source, /USGS earthquake data is currently unavailable/);
  assert.match(source, /Cache-Control": "no-store"/);
  assert.doesNotMatch(source, /features:\s*\[\][\s\S]*status:\s*503/);
});
