import Ffmpeg from "fluent-ffmpeg";
import cfg from "../../config.js";
import { Readable, Stream } from "stream";
import { isPremium } from "../../utils/isPremium.js";
import { getCachedOrDBChatSettings } from "../../utils/chatSettingsUtils.js";

async function overlayChartOnVideo(chartBuffer: Buffer, target_id: number, chat_id: number): Promise<Buffer> {
    const [isPremiumUser, chatSettings] = await Promise.all([isPremium(chat_id), getCachedOrDBChatSettings(chat_id)]);
    const imageStream = Readable.from(chartBuffer);
    const outputChunks: Buffer[] = [];

    if (isPremiumUser && chatSettings.usechatbgforall) {
        target_id = chat_id;
    }

    return new Promise((resolve, reject) => {
        const passthroughStream = new Stream.PassThrough();
        // const ffmpegTime = new Date().getTime();
        Ffmpeg(`${cfg.PATHS.BASE_BG_PATH}/${target_id}.mp4`)
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
