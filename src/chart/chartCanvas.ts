import { Canvas, createCanvas } from "canvas";
//@ts-expect-error
import deePool from "deepool";

function makeCanvas() {
  return createCanvas(1280, 640);
}

const canvasPool = deePool.create(makeCanvas);

class _ChartCanvasManager {
  private _canvasPool: any;

  constructor(canvasPool: any) {
    this._canvasPool = canvasPool;
  }

  get get(): Canvas {
    return this._canvasPool.use();
  }

  public recycle(canvas: Canvas): void {
    this._canvasPool.recycle(canvas);
  }
}

const ChartCanvasManager = new _ChartCanvasManager(canvasPool);

export { ChartCanvasManager };
