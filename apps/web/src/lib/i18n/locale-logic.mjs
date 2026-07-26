export const LOCALE_STORAGE_KEY = "atlas.locale";
export const SUPPORTED_LOCALES = Object.freeze(["en", "th"]);

export function isSupportedLocale(value) {
  return value === "en" || value === "th";
}

export function localeFromDevice(languages = [], language = "") {
  const candidates = [...languages, language].filter((value) => typeof value === "string");
  return candidates.some((value) => value.toLowerCase().startsWith("th")) ? "th" : "en";
}

export function resolveLocale(storedLocale, languages = [], language = "") {
  return isSupportedLocale(storedLocale)
    ? storedLocale
    : localeFromDevice(languages, language);
}

export function localeTag(locale) {
  return locale === "th" ? "th-TH-u-ca-gregory" : "en-US";
}

export function formatDateTimeValue(value, locale, options = {}) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(date);
}

export function relativeTimeParts(value, now = Date.now()) {
  const then = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(then)) return null;
  const elapsed = Math.max(0, now - then);
  if (elapsed < 3_600_000) return { unit: "minutes", count: Math.max(1, Math.floor(elapsed / 60_000)) };
  if (elapsed < 86_400_000) return { unit: "hours", count: Math.floor(elapsed / 3_600_000) };
  return { unit: "days", count: Math.floor(elapsed / 86_400_000) };
}
