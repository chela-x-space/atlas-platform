"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import type { AtlasLocale } from "@/lib/i18n/types";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const choices: ReadonlyArray<{ locale: AtlasLocale; label: string; name: string }> = [
    { locale: "en", label: "EN", name: t("language.english") },
    { locale: "th", label: "ไทย", name: t("language.thai") },
  ];

  return (
    <div className="atlas-language-switcher" role="group" aria-label={t("language.selector")}>
      {choices.map((choice) => (
        <button
          key={choice.locale}
          type="button"
          lang={choice.locale}
          aria-label={choice.name}
          aria-pressed={locale === choice.locale}
          onClick={() => setLocale(choice.locale)}
        >
          {choice.label}
          <span className="sr-only">{locale === choice.locale ? ` (${t("language.active")})` : ""}</span>
        </button>
      ))}
    </div>
  );
}
