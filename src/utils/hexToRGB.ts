function hexToRGB(hex: string) {
  if (hex.length !== 7) {
    return undefined;
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if ([r, g, b].some(isNaN)) {
    return undefined;
  }

  return { r, g, b };
}

export { hexToRGB };
