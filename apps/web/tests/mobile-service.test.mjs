import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(path,import.meta.url),"utf8");

test("mobile service uses real dashboard data and explicit fallback states",async()=>{
  const source=await read("../src/components/mobile/AtlasMobileOverview.tsx");
  assert.match(source,/fetch\("\/api\/dashboard"/);
  assert.match(source,/timelineEvents/);
  assert.match(source,/strongestEarthquake/);
  assert.match(source,/activeCyclones/);
  assert.match(source,/Source health/);
  assert.match(source,/No substitute values are shown/);
  assert.doesNotMatch(source,/mock|placeholder/i);
});

test("mobile navigation is bounded and map is opt-in",async()=>{
  const source=await read("../src/components/mobile/AtlasMobileOverview.tsx");
  assert.match(source,/Overview<\/Link>/);
  assert.match(source,/>Map<\/a>/);
  assert.match(source,/>Events<\/Link>/);
  assert.match(source,/>Alerts<\/Link>/);
  assert.match(source,/>More<\/button>/);
  assert.match(source,/mapOpen\?<div className="atlas-mobile-map"/);
});

test("viewport preserves zoom and mobile CSS removes forced desktop width",async()=>{
  const layout=await read("../src/app/layout.tsx"),css=await read("../src/app/app/dashboard.css");
  assert.match(layout,/width: "device-width"/);
  assert.match(layout,/initialScale: 1/);
  assert.doesNotMatch(layout,/userScalable|maximumScale/);
  assert.match(css,/@media \(max-width: 1179px\)[\s\S]*min-width: 0/);
  assert.match(css,/min-height: 44px/);
});
