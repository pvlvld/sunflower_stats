import dotenv from "dotenv";
dotenv.config();
const requiredEnv = [
    "BOT_TOKEN",
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_DATABASE",
    "RABBITMQ_USER",
    "RABBITMQ_PASSWORD",
] as const;

type ICfg = Record<(typeof requiredEnv)[number], string> & {
    CHART: { width: number; height: number; ratio: number };
    PATHS: {
        BASE_BG_PATH: string;
        BASE_AVATAR_PATH: string;
    };
    BOT_ID: number;
};

function getConfig() {
    const cfg: ICfg = {} as ICfg;
    for (const e of requiredEnv) {
        if (e in process.env) {
            cfg[e] = process.env[e]!;
            continue;
        }
        throw new Error(`Bruh, fix your .env! Where's the ${e}?`);
    }

    cfg.CHART = {
        width: 1280,
        height: 640,
        ratio: 1280 / 640,
    };

    cfg.PATHS = {
        BASE_BG_PATH: "../data/chartBg",
        BASE_AVATAR_PATH: "../data/profileImages",
    };

    cfg.BOT_ID = 6081112363;

    return cfg;
}

export const config = getConfig();
