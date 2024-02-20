function collectGarbage() {
  if (typeof Bun !== "undefined") {
    Bun.gc(false);
    return;
  }
  if (global.gc) {
    global.gc();
    return;
  }
}

export default collectGarbage;
