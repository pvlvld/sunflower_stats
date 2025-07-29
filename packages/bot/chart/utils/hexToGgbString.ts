import { hexToRGB } from "../../utils/hexToRGB.js";

function hexToGgbString(hex: string) {
    const rgb = hexToRGB(hex)!;
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

export { hexToGgbString };
