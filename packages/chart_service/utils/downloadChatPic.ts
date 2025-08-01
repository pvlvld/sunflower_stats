import { config } from "../consts/config.js";
import * as fs from "node:fs";

interface IChatResponse {
    ok: boolean;
    result?: {
        photo?: {
            small_file_id: string;
        };
    };
}

interface IFileResponse {
    ok: boolean;
    result?: {
        file_path: string;
    };
}

async function downloadChatPic(chat_id: number) {
    // TODO: Replace with Moment.js and check last modified date.
    if (new Date().getDate() % 7 !== 0 && fs.existsSync(`${config.PATHS.BASE_AVATAR_PATH}/${chat_id}.jpg`)) {
        console.log(`Avatar for chat ${chat_id} already exists, skipping download.`);
        return true;
    }

    const chatResponse = await fetch(`https://api.telegram.org/bot${config.BOT_TOKEN}/getChat?chat_id=${chat_id}`)
        .then((response) => response.json() as Promise<IChatResponse>)
        .catch((e) => {
            console.error(e);
            return undefined;
        });

    if (!chatResponse || typeof chatResponse.result?.photo?.small_file_id !== "string") {
        return false;
    }

    const fileResponse = await fetch(
        `https://api.telegram.org/bot${config.BOT_TOKEN}/getFile?file_id=${chatResponse.result.photo.small_file_id}`
    )
        .then((response) => response.json() as Promise<IFileResponse>)
        .catch((e) => {
            console.error(e);
            return undefined;
        });

    if (!fileResponse || typeof fileResponse.result?.file_path !== "string") {
        return false;
    }

    const filePath = fileResponse.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${filePath}`;
    const response = await fetch(fileUrl);
    if (!response.ok) {
        console.error(`Failed to download file from ${fileUrl}`);
        return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePathToSave = `${config.PATHS.BASE_AVATAR_PATH}/${chat_id}.jpg`;
    fs.mkdirSync(config.PATHS.BASE_AVATAR_PATH, { recursive: true });
    fs.writeFileSync(filePathToSave, buffer);
    return true;
}

export { downloadChatPic };
