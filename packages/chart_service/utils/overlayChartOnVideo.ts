import Ffmpeg from "fluent-ffmpeg";
import { Readable, Stream } from "stream";
import { isPremium } from "./isPremium.js";
import { config } from "../consts/config.js";
import type { IChartStatsTask } from "@sunflower-stats/shared";

async function overlayChartOnVideo(chartBuffer: Buffer, task: IChartStatsTask): Promise<Buffer> {
    const imageStream = Readable.from(chartBuffer);
    const outputChunks: Buffer[] = [];
    let target_id = task.target_id;

    if (isPremium(task, task.chat_id) && task.usechatbgforall) {
        target_id = task.chat_id;
    }

    return new Promise((resolve, reject) => {
        const passthroughStream = new Stream.PassThrough();
        // const ffmpegTime = new Date().getTime();
        Ffmpeg(`${config.PATHS.BASE_BG_PATH}/${target_id}.mp4`)
            .input(imageStream)
            .complexFilter([`overlay=W-w-0:H-h-0`])
            .format("mp4")
            .outputOptions(["-movflags frag_keyframe+empty_moov", "-preset superfast", "-crf 26"])
            .on("error", reject)
            // .on("stderr", console.error)
            .pipe(passthroughStream);

        passthroughStream.on("data", (buf) => outputChunks.push(buf));
        passthroughStream.on("error", (err) => {
            console.error("Error in passthrough stream:", err);
            reject(err);
        });
        passthroughStream.on("end", () => {
            resolve(Buffer.concat(outputChunks));
            // console.log(`FFmpeg time: ${new Date().getTime() - ffmpegTime}ms`);
        });
    });
}

export { overlayChartOnVideo };
