const _defaultUserSettings = {
    locale: "en",
    line_color: "e9bd07",
    font_color: "eeeeee",
};

const DefaultUserSettings = Object.freeze(_defaultUserSettings);

type IUserSettings = typeof _defaultUserSettings;

export { DefaultUserSettings, IUserSettings };
