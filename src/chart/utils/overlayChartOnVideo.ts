import Ffmpeg from "fluent-ffmpeg";
import cfg from "../../config.js";
import { Readable, Stream } from "stream";

async function overlayChartOnVideo(chartBuffer: Buffer, id: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const imageStream = Readable.from(chartBuffer);
        const passthroughStream = new Stream.PassThrough();
        const outputChunks: Buffer[] = [];

        Ffmpeg(`${cfg.PATHS.BASE_BG_PATH}/${id}.mp4`)
            .input(imageStream)
            .complexFilter([`overlay=W-w-0:H-h-0`])
            .format("mp4")
            .outputOptions(["-movflags frag_keyframe+empty_moov"])
            .pipe(passthroughStream)
            .on("end", () => passthroughStream.end())
            .on("error", reject)
            .on("stderr", console.error);

        passthroughStream.on("data", function (buf) {
            outputChunks.push(buf);
        });
        passthroughStream.on("error", function (err) {
            console.error("Error in passthrough stream:", err);
            reject(err);
        });
        passthroughStream.on("end", function () {
            resolve(Buffer.concat(outputChunks));
        });
    });
}

export { overlayChartOnVideo };
