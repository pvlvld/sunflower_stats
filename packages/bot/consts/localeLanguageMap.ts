// Alphabetical order (almost)
const LOCALE_LANGUAGE_MAP = Object.freeze({
    uk: "Українська", //        Base
    en: "English", //           Main
    // be: "Беларуская",
    // cs: "Čeština", //           Top priority
    // de: "Deutsch", //           Top priority
    // es: "Español", //           Top priority
    // fr: "Français",
    // hi: "हिंदी", //               Top priority
    // id: "Bahasa Indonesia", //  Top priority
    // it: "Italiano", //          Top priority
    // ja: "日本語",
    // ko: "한국어",
    pl: "Polski", //            Top priority
    // pt: "Língua portuguesa", // Top priority
    // zh_CN: "中文 (简体)",
    // zh_HK: "中文 (繁體)",
    ks: "котяча", //    Hidden, used for meme cat lang
} as const);

const HIDDEN_LOCALES = Object.freeze(["ks"]);

type ILocaleCode = keyof typeof LOCALE_LANGUAGE_MAP;

const LOCALE_LANGUAGE_MAP_REVERSED = Object.freeze(
    Object.fromEntries(Object.entries(LOCALE_LANGUAGE_MAP).map(([locale, language]) => [language, locale]))
);

type _ILocaleLanguageMap = typeof LOCALE_LANGUAGE_MAP;
type ILocaleLanguageMap = {
    [K in keyof _ILocaleLanguageMap | (string & {})]: string;
};

export { LOCALE_LANGUAGE_MAP, ILocaleLanguageMap, LOCALE_LANGUAGE_MAP_REVERSED, ILocaleCode, HIDDEN_LOCALES };
