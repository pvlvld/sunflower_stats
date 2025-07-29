import { isPremium } from "./isPremium.js";

async function getPremiumMarkSpaced(id: number) {
    return (await isPremium(id)) ? " 👑 " : " ";
}

export { getPremiumMarkSpaced };
