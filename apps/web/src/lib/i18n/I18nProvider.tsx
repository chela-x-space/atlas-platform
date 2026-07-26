"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { MessageKey } from "./messages/en";
import type { AtlasLocale, MessageValues } from "./types";
import { translate } from "./locale";
import {
  formatDateTimeValue,
  LOCALE_STORAGE_KEY,
  relativeTimeParts,
  resolveLocale,
} from "./locale-logic.mjs";

type I18nContextValue = {
  locale: AtlasLocale;
  setLocale: (locale: AtlasLocale) => void;
  t: (key: MessageKey, values?: MessageValues) => string;
  formatDateTime: (value: string | number | Date) => string;
  formatNumber: (value: number) => string;
  formatRelativeTime: (value: string | number | Date, now?: number) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, updateLocale] = useState<AtlasLocale>("en");

  useEffect(() => {
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(LOCALE_STORAGE_KEY); } catch {}
    const resolved = resolveLocale(stored, navigator.languages, navigator.language);
    document.documentElement.lang = resolved;
    const timer = window.setTimeout(() => updateLocale(resolved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setLocale = useCallback((nextLocale: AtlasLocale) => {
    updateLocale(nextLocale);
    document.documentElement.lang = nextLocale;
    try { window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale); } catch {}
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key, values) => translate(locale, key, values),
    formatDateTime: (input) => formatDateTimeValue(input, locale),
    formatNumber: (input) => new Intl.NumberFormat(locale === "th" ? "th-TH-u-nu-latn" : "en-US").format(input),
    formatRelativeTime: (input, now) => {
      const parts = relativeTimeParts(input, now);
      if (!parts) return translate(locale, "label.unknown");
      const key = `time.${parts.unit}Ago` as MessageKey;
      return translate(locale, key, { count: parts.count });
    },
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
