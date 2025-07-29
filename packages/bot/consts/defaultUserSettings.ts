import cfg from "../config.js";

const _defaultUserSettings = {
    locale: cfg.DEFAULT_LOCALE,
    line_color: "e9bd07",
    font_color: "eeeeee",
};

const DefaultUserSettings = Object.freeze(_defaultUserSettings);

type IUserSettings = typeof _defaultUserSettings;

export { DefaultUserSettings, IUserSettings };
