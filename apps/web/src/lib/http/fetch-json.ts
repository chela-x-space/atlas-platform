import { fetchText, UpstreamError } from "./fetch-text";
export async function fetchJson<T>(url: string, options: { timeoutMs?: number; maxBytes?: number; revalidate?: number; validate: (value: unknown) => value is T }): Promise<{ data: T; fetchedAt: string }> {
  const result = await fetchText(url, { ...options, acceptedContentTypes: ["application/json", "application/geo+json"] });
  let value: unknown;
  try { value = JSON.parse(result.body); } catch { throw new UpstreamError("invalid-upstream-data", "Upstream returned malformed JSON"); }
  if (!options.validate(value)) throw new UpstreamError("invalid-upstream-data", "Upstream JSON failed validation");
  return { data: value, fetchedAt: result.fetchedAt };
}
