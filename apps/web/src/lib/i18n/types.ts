export const SUPPORTED_LOCALES = ["en", "th"] as const;

export type AtlasLocale = (typeof SUPPORTED_LOCALES)[number];
export type MessageDictionary = Readonly<Record<string, string>>;
export type MessageValues = Readonly<Record<string, string | number>>;
