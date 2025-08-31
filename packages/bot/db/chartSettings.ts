import { RGB } from "../utils/hexToRGB.js";
import { DefaultUserSettings } from "../consts/defaultUserSettings.js";

const DefaultChartSettings = DefaultUserSettings;

type IChartSettings = Omit<typeof DefaultUserSettings, "locale">;

class ChartSettings {
    constructor(
        public line_color: RGB,
        public font_color: RGB,
    ) {}
}

export default ChartSettings;
export { DefaultChartSettings, IChartSettings };
