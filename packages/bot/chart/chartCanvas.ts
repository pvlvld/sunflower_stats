import { Canvas, createCanvas } from "canvas";
import cfg from "../config.js";
//@ts-expect-error
import deePool from "deepool";

function makeCanvas(width: number = undefined!, height: number = undefined!): Canvas {
    return createCanvas(width || cfg.CHART.width, height || cfg.CHART.height);
}

const canvasPool = deePool.create(makeCanvas);

class _ChartCanvasManager {
    private _canvasPool: any;
    private _canvasPoolX2: any;

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
