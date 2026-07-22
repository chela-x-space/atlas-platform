export type UpstreamErrorCode = "timeout" | "unavailable" | "invalid-content-type" | "response-too-large" | "invalid-upstream-data";
export class UpstreamError extends Error {
  constructor(public code: UpstreamErrorCode, message: string, public status = 502) { super(message); this.name = "UpstreamError"; }
}
type FetchTextOptions = { timeoutMs?: number; maxBytes?: number; acceptedContentTypes?: readonly string[]; revalidate?: number };
export async function fetchText(url: string, options: FetchTextOptions = {}): Promise<{ body: string; contentType: string; fetchedAt: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: (options.acceptedContentTypes ?? ["text/plain"]).join(", "), "User-Agent": "ATLAS/1.0 (+https://github.com/)" }, next: { revalidate: options.revalidate ?? 300 } });
    if (!response.ok) throw new UpstreamError("unavailable", `Upstream returned HTTP ${response.status}`, response.status >= 500 ? 503 : 502);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (options.acceptedContentTypes?.length && !options.acceptedContentTypes.some((type) => contentType.includes(type))) throw new UpstreamError("invalid-content-type", "Unexpected upstream content type");
    const declaredLength = Number(response.headers.get("content-length"));
    const maxBytes = options.maxBytes ?? 1_000_000;
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new UpstreamError("response-too-large", "Upstream response exceeds size limit");
    const body = await response.text();
    if (new TextEncoder().encode(body).byteLength > maxBytes) throw new UpstreamError("response-too-large", "Upstream response exceeds size limit");
    return { body, contentType, fetchedAt: new Date().toISOString() };
  } catch (error) {
    if (error instanceof UpstreamError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new UpstreamError("timeout", "Upstream request timed out", 504);
    throw new UpstreamError("unavailable", "Upstream request failed", 503);
  } finally { clearTimeout(timer); }
}
