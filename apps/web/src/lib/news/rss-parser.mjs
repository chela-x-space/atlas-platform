function parserError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
function decode(value) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .trim();
}
function tag(block, names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match) return decode(match[1]);
  }
  return "";
}
function link(block) {
  const atom = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
  return atom ? decode(atom[1]) : tag(block, ["link", "guid"]);
}
export function stripUnsafeHtml(value) {
  return decode(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ").trim();
}
export function parseRssOrAtom(xml, limit = 30) {
  if (xml.length > 1_000_000) throw parserError("response-too-large", "Feed exceeds parser limit");
  if (!/<(?:rss|feed)\b/i.test(xml)) throw parserError("invalid-upstream-data", "Not RSS or Atom XML");
  if (!/<\/(?:rss|feed)>/i.test(xml)) throw parserError("invalid-upstream-data", "Malformed RSS or Atom XML");
  const blocks = xml.match(/<(?:item|entry)\b[^>]*>[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  return blocks.slice(0, limit).map((block) => {
    const title = stripUnsafeHtml(tag(block, ["title"]));
    const description = stripUnsafeHtml(tag(block, ["description", "summary", "content:encoded", "content"]));
    const href = link(block);
    const rawDate = tag(block, ["pubDate", "published", "updated", "dc:date"]);
    const date = new Date(rawDate);
    return {
      title,
      description,
      link: href,
      publishedAt: Number.isNaN(date.valueOf()) ? "" : date.toISOString(),
      author: stripUnsafeHtml(tag(block, ["author", "dc:creator"])) || undefined,
    };
  }).filter((item) => item.title && item.link && item.publishedAt);
}
