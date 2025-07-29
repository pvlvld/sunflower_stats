function hexToRGB(hex: string | undefined) {
    const length = hex?.length;
    if (!length || length > 7 || length < 6) {
        return undefined;
    }

    const offset = length === 7 ? 1 : 0;

    const r = parseInt(hex.slice(0 + offset, 2 + offset), 16);
    const g = parseInt(hex.slice(2 + offset, 4 + offset), 16);
    const b = parseInt(hex.slice(4 + offset, 6 + offset), 16);

    if ([r, g, b].some(isNaN)) {
        return undefined;
    }

    return new RGB(r, g, b);
}

class RGB {
    constructor(
        public r: number,
        public g: number,
        public b: number
    ) {}
}

export { hexToRGB, RGB };
