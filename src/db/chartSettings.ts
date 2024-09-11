import { RGB } from "../utils/hexToRGB.js";

const _defaultChartSettings = {
    line_color: "e9bd07",
    font_color: "eeeeee",
};

const DefaultChartSettings = Object.freeze(_defaultChartSettings);

type IChartSettings = typeof _defaultChartSettings;

class ChartSettings {
    constructor(
        public line_color: RGB,
        public font_color: RGB
    ) {}
}

export default ChartSettings;
export { DefaultChartSettings, IChartSettings };
