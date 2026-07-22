const BLOCKED_EXTENSIONS = new Set([
  "7z", "avi", "bin", "bmp", "bz2", "css", "csv", "data", "dmg", "doc", "docx",
  "exe", "gif", "geojson", "gz", "ico", "jpeg", "jpg", "js", "json", "kml", "kmz",
  "map", "mjs", "mov", "mp3", "mp4", "pdf", "png", "rar", "rss", "shp", "svg", "tar",
  "tif", "tiff", "ts", "webm", "webp", "woff", "woff2", "xls", "xlsx", "xml", "zip",
]);

const FEED_PATHS = [/\/(?:atom|feed|feeds|rss)(?:\/|$)/i];

/** Return a normalized public detail URL, or null for unsafe/non-navigational URLs. */
export function safeExternalUrl(value) {
  if (typeof value !== "string" || value.trim() === "" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname || url.username || url.password) return null;
    const path = url.pathname.toLowerCase();
    const finalSegment = path.split("/").filter(Boolean).at(-1) ?? "";
    const extension = finalSegment.includes(".") ? finalSegment.split(".").at(-1) : "";
    if (extension && BLOCKED_EXTENSIONS.has(extension)) return null;
    if (FEED_PATHS.some((pattern) => pattern.test(path))) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isSafeExternalUrl(value) {
  return safeExternalUrl(value) !== null;
}
