import { en, type MessageKey } from "./messages/en";
import { th } from "./messages/th";
import type { AtlasLocale, MessageValues } from "./types";

export function translate(locale: AtlasLocale, key: string, values?: MessageValues) {
  const localized = (locale === "th" ? th : en) as Readonly<Record<string, string>>;
  const fallback = en as Readonly<Record<string, string>>;
  const message = localized[key] ?? fallback[key] ?? key;
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (token, name) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : token);
}

export function dictionaryKeyMismatch() {
  const english = new Set(Object.keys(en));
  const thai = new Set(Object.keys(th));
  return {
    missingFromEnglish: [...thai].filter((key) => !english.has(key)).sort(),
    missingFromThai: [...english].filter((key) => !thai.has(key)).sort(),
  };
}

export type { MessageKey };
