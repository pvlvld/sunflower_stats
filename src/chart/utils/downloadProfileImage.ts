import bot from "../../bot.js";

async function downloadProfileImage(id: number) {
    const chat = await bot.api.getChat(id).catch((e) => {
        console.error(e);
        return undefined;
    });

    if (!chat || chat.photo?.small_file_id === undefined) return false;

    try {
        const file = await bot.api.getFile(chat.photo?.small_file_id);
        await file.download(`./data/profileImages/${id}.jpg`);
    } catch (error) {
        return false;
    }
    return true;
}

export { downloadProfileImage };
