import { Canvas, createCanvas } from "canvas";
import cfg from "../config.js";
//@ts-expect-error
import deePool from "deepool";

function makeCanvas(width: number = undefined!, height: number = undefined!): Canvas {
    return createCanvas(width || cfg.CHART.width, height || cfg.CHART.height);
}

const canvasPool = deePool.create(makeCanvas);
const canvasPoolX2 = deePool.create(() => makeCanvas(cfg.CHART.width * 2, cfg.CHART.height * 2));

class _ChartCanvasManager {
    private _canvasPool: any;
    private _canvasPoolX2: any;

    constructor(canvasPool: any) {
        this._canvasPool = canvasPool;
        this._canvasPoolX2 = canvasPoolX2;
    }

    get get(): Canvas {
        return this._canvasPool.use();
    }

    get getX2(): Canvas {
        return this._canvasPoolX2.use();
    }

    public recycle(canvas: Canvas): void {
        this._canvasPool.recycle(canvas);
    }

    public recycleX2(canvas: Canvas): void {
        this._canvasPoolX2.recycle(canvas);
    }
}

const ChartCanvasManager = new _ChartCanvasManager(canvasPool);

export { ChartCanvasManager };
