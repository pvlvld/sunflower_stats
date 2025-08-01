import bot from "../../bot.js";

// TODO: Always download if existing file is not the same as the one on the server (u file id?)
async function downloadChatPic(chat_id: number) {
    const chat = await bot.api.getChat(chat_id).catch((e) => {
        console.error(e);
        return undefined;
    });

    if (!chat || chat.photo?.small_file_id === undefined) return false;

    try {
        const file = await bot.api.getFile(chat.photo?.small_file_id);
        await file.download(`./data/profileImages/${chat_id}.jpg`);
    } catch (error) {
        return false;
    }
    return true;
}

const downloadAvatar = {
    chat: downloadChatPic,
};

export { downloadAvatar };
