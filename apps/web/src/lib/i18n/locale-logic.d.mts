import type { AtlasLocale } from "./types";

export const LOCALE_STORAGE_KEY: "atlas.locale";
export const SUPPORTED_LOCALES: readonly AtlasLocale[];
export function isSupportedLocale(value: unknown): value is AtlasLocale;
export function localeFromDevice(languages?: readonly string[], language?: string): AtlasLocale;
export function resolveLocale(storedLocale: unknown, languages?: readonly string[], language?: string): AtlasLocale;
export function localeTag(locale: AtlasLocale): string;
export function formatDateTimeValue(value: string | number | Date, locale: AtlasLocale, options?: Intl.DateTimeFormatOptions): string;
export function relativeTimeParts(value: string | number | Date, now?: number): { unit: "minutes" | "hours" | "days"; count: number } | null;
