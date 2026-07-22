import { UpstreamError } from "@/lib/http/fetch-text";
export type ParsedFeedItem = { title: string; description: string; link: string; publishedAt: string; author?: string; imageUrl?: string };
function decode(value: string): string { return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim(); }
function tag(block: string, names: string[]): string { for (const name of names) { const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i")); if (match) return decode(match[1]); } return ""; }
function link(block: string): string { const atom = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i); return atom ? decode(atom[1]) : tag(block, ["link", "guid"]); }
export function stripUnsafeHtml(value: string): string { return decode(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
export function parseRssOrAtom(xml: string, limit = 30): ParsedFeedItem[] {
  if (xml.length > 1_000_000) throw new UpstreamError("response-too-large", "Feed exceeds parser limit");
  if (!/<(?:rss|feed)\b/i.test(xml)) throw new UpstreamError("invalid-upstream-data", "Not RSS or Atom XML");
  const blocks = xml.match(/<(?:item|entry)\b[^>]*>[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  return blocks.slice(0, limit).map((block) => { const title = stripUnsafeHtml(tag(block, ["title"])); const description = stripUnsafeHtml(tag(block, ["description", "summary", "content:encoded", "content"])); const href = link(block); const rawDate = tag(block, ["pubDate", "published", "updated", "dc:date"]); const date = new Date(rawDate); return { title, description, link: href, publishedAt: Number.isNaN(date.valueOf()) ? "" : date.toISOString(), author: stripUnsafeHtml(tag(block, ["author", "dc:creator"])) || undefined }; }).filter((item) => item.title && item.link && item.publishedAt && /^https:\/\//i.test(item.link));
}
