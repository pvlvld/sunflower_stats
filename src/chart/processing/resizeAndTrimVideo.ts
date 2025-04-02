import Ffmpeg from "fluent-ffmpeg";
import cfg from "../../config.js";
import fs from "node:fs";
import path from "node:path";

function resizeAndTrimVideo(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const inputPath = path.join(cfg.PATHS.BASE_BG_PATH, `${id}.mp4`);
        const tempPath = path.join(cfg.PATHS.BASE_BG_PATH, `${id}_resized.mp4`);
        const outputPath = inputPath; // Final destination, gg

        if (!fs.existsSync(inputPath)) {
            return reject(new Error("File does not exist"));
        }

        const { width, height } = cfg.CHART;

        Ffmpeg(inputPath)
            .outputOptions([
                `-vf scale=w=${width}:h=${height}:flags=lanczos:force_original_aspect_ratio=increase,crop=${width}:${height}`,
                "-c:v libx264",
                "-preset slower",
                "-crf 20",
                "-movflags +faststart",
            ])
            .duration(10)
            .on("start", (cmdline) => cfg.DEBUG && console.log("resizeAndTrimVideo Ffmpeg cmd:\n", cmdline))
            .on("end", () => {
                fs.rename(tempPath, outputPath, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            })
            .on("error", (e) => {
                fs.unlink(inputPath, (e) => {});
                fs.unlink(tempPath, (e) => {});
                reject(e);
            })
            .save(tempPath);
    });
}

export { resizeAndTrimVideo };
