import Ffmpeg from "fluent-ffmpeg";
import cfg from "../../config.js";
import { Readable, Stream } from "stream";
import { isPremium } from "../../utils/isPremium.js";
import { getCachedOrDBChatSettings } from "../../utils/chatSettingsUtils.js";

async function overlayChartOnVideo(chartBuffer: Buffer, target_id: number, chat_id: number): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        const imageStream = Readable.from(chartBuffer);
        const passthroughStream = new Stream.PassThrough();
        const outputChunks: Buffer[] = [];

        if ((await isPremium(chat_id)) && (await getCachedOrDBChatSettings(chat_id)).usechatbgforall) {
            target_id = chat_id;
        }

        Ffmpeg(`${cfg.PATHS.BASE_BG_PATH}/${target_id}.mp4`)
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
