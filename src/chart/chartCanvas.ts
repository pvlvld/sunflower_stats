import { CanvasRenderingContext2D, createCanvas } from "canvas";

const deePool = require("deepool");

function makeCanvas() {
  return createCanvas(1200, 600).getContext("2d");
}

const canvasPool = deePool.create(makeCanvas);

class _ChartCanvasManager {
  private _canvasPool: any;

  constructor(canvasPool: any) {
    this._canvasPool = canvasPool;
  }

  get get(): CanvasRenderingContext2D {
    return this._canvasPool.use();
  }

  public recycle(canvas: CanvasRenderingContext2D): void {
    this._canvasPool.recycle(canvas);
  }
}

const ChartCanvasManager = new _ChartCanvasManager(canvasPool);

export { ChartCanvasManager };
