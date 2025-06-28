const LOCALE_LANGUAGE_MAP = Object.freeze({
    be: "Беларуская",
    de: "Deutsch",
    en: "English",
    es: "Español",
    fr: "Français",
    hi: "हिंदी",
    it: "Italiano",
    ja: "日本語",
    ko: "한국어",
    pl: "Polski",
    uk: "Українська",
    zh_CN: "中文 (简体)",
    zh_HK: "中文 (繁體)",
} as const);

type ILocaleCode = keyof typeof LOCALE_LANGUAGE_MAP;

const LOCALE_LANGUAGE_MAP_REVERSED = Object.freeze(
    Object.fromEntries(Object.entries(LOCALE_LANGUAGE_MAP).map(([locale, language]) => [language, locale]))
);

type _ILocaleLanguageMap = typeof LOCALE_LANGUAGE_MAP;
type ILocaleLanguageMap = {
    [K in keyof _ILocaleLanguageMap | (string & {})]: string;
};

export { LOCALE_LANGUAGE_MAP, ILocaleLanguageMap, LOCALE_LANGUAGE_MAP_REVERSED, ILocaleCode };
