import dotenv from "dotenv";
dotenv.config();

const DefaultConfigSettings = {
    charts: true,
};

type IConfigSettings = typeof DefaultConfigSettings;

const requiredEnv = ["BOT_TOKEN", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_DATABASE", "API_HASH"] as const;

const ANIMATIONS = Object.freeze({
    no_stats: "CgACAgQAAx0Cf9EqrAACDUJmaJE8Jw9eTnlvmTG_GLslPqJJ8gACeQMAAr3JBFN7f2AJi52nTTUE",
    ThePrimeagen: "CgACAgQAAx0Cf9EqrAACDU1maJUfleSUmeFFT8YYGIC5FzrIDgACxAQAAvRCfVMq7ofhhIVE6zUE",
});

const MEDIA = Object.freeze({
    ANIMATIONS,
});
let _log_lvl = 0;
const LOG_LVL = {
    get: () => {
        return _log_lvl;
    },
    set: (lvl: number) => {
        _log_lvl = lvl;
        return _log_lvl;
    },
};
type IBotStatus = "running" | "stopping";
type ICfg = Record<(typeof requiredEnv)[number], string> & {
    ADMINS: number[];
    STATUSES: { LEFT_STATUSES: string[] };
    IGNORE_IDS: number[];
    ANALYTICS_CHAT: number;
    MAIN_CHAT: number;
    STATS_DEFAULT_TTL: number;
    MEDIA: typeof MEDIA;
    API_ID: number;
    SETTINGS: IConfigSettings;
    CHART: { width: number; height: number; ratio: number };
    LOG_LVL: typeof LOG_LVL;
    BOT_STATUS: IBotStatus;
    SET_STATUS: (status: IBotStatus) => IBotStatus;
};

function getCfg() {
    const cfg = {} as ICfg;

    for (const e of requiredEnv) {
        if (e in process.env) {
            cfg[e] = process.env[e]!;
            continue;
        }
        throw new Error(`Bruh, fix your .env! Where's the ${e}?`);
    }
    cfg.BOT_STATUS = "running";
    cfg.SET_STATUS = (status: IBotStatus) => (cfg.BOT_STATUS = status);
    cfg.ADMINS = (process.env.ADMINS?.split(" ") || []).map((id) => Number(id));
    cfg.STATUSES ??= {} as any;
    cfg.STATUSES.LEFT_STATUSES = ["kicked", "left"];
    cfg.IGNORE_IDS = [1087968824, 136817688, 777000, -1];
    cfg.ANALYTICS_CHAT = -1002144414380;
    cfg.MAIN_CHAT = -1001898242958;
    /** 5m */
    cfg.STATS_DEFAULT_TTL = 5 * 60;
    cfg.MEDIA = MEDIA;
    cfg.API_ID = Number(process.env.API_ID || -1);
    cfg.SETTINGS = DefaultConfigSettings;
    cfg.CHART = { width: 1280, height: 640, ratio: 1280 / 640 };
    cfg.LOG_LVL = LOG_LVL;

    return Object.freeze(cfg);
}

const cfg = getCfg();

export default cfg;
