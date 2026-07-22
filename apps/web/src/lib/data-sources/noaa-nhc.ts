import { getActiveDataSource } from "@/config/data-sources";
import { fetchText } from "@/lib/http/fetch-text";
import type { AtlasEvent } from "@/types/atlas-data";

function text(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
}

export function normalizeNhcFeed(xml: string, basin: string, sourceUrl: string): AtlasEvent[] {
  const blocks = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) ?? [];
  const events: AtlasEvent[] = [];
  for (const [index, block] of blocks.entries()) {
    if (!/<nhc:Cyclone\b/i.test(block) && !/Summary\s*-/i.test(text(block, "title"))) continue;
    const center = text(block, "nhc:center");
    const coordinateMatch = center.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    const advisoryDate = new Date(text(block, "nhc:datetime"));
    const feedDate = new Date(text(block, "pubDate"));
    const published = Number.isNaN(advisoryDate.valueOf()) ? feedDate : advisoryDate;
    if (Number.isNaN(published.valueOf())) continue;
    const link = text(block, "link") || sourceUrl;
    const name = text(block, "nhc:name") || "Unnamed tropical cyclone";
    const type = text(block, "nhc:type") || "Tropical cyclone";
    const atcf = text(block, "nhc:atcf");
    events.push({ id: atcf || `nhc-${basin}-${published.valueOf()}-${index}`, category: "cyclone", title: `${type} ${name}`.trim(), summary: text(block, "nhc:headline") || text(block, "description") || "Official NHC advisory", severity: "unknown", occurredAt: published.toISOString(), updatedAt: published.toISOString(), sourceId: "noaa-nhc", sourceName: "NOAA National Hurricane Center", sourceUrl: /^https:\/\//.test(link) ? link : sourceUrl, ...(coordinateMatch ? { coordinates: [Number(coordinateMatch[2]), Number(coordinateMatch[1])] as [number, number] } : {}), metadata: { basin, advisoryTime: text(block, "nhc:datetime"), stormName: name, atcf } });
  }
  return events;
}

export async function getCyclones() {
  const source = getActiveDataSource("noaa-nhc");
  const settled = await Promise.all(Object.entries(source.endpoints).map(async ([basin, url]) => {
    try { const result = await fetchText(url, { timeoutMs: 8000, maxBytes: 1_000_000, acceptedContentTypes: ["xml", "rss", "text/plain"], revalidate: source.refreshSeconds }); return { basin, url, ok: true, fetchedAt: result.fetchedAt, events: normalizeNhcFeed(result.body, basin, url) }; }
    catch { return { basin, url, ok: false, fetchedAt: new Date().toISOString(), events: [] as AtlasEvent[] }; }
  }));
  return { events: settled.flatMap((feed) => feed.events), sources: settled.map(({ events, ...feed }) => ({ ...feed, itemCount: events.length })), fetchedAt: new Date().toISOString(), attribution: source.attribution };
}
