import dotenv from "dotenv";
dotenv.config();

const DefaultConfigSettings = {
  charts: true,
};

type IConfigSettings = typeof DefaultConfigSettings;

const requiredEnv = [
  "BOT_TOKEN",
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_DATABASE",
  "API_HASH",
] as const;

const ANIMATIONS = Object.freeze({
  no_stats: "CgACAgQAAx0Cf9EqrAACDUJmaJE8Jw9eTnlvmTG_GLslPqJJ8gACeQMAAr3JBFN7f2AJi52nTTUE",
  ThePrimeagen: "CgACAgQAAx0Cf9EqrAACDU1maJUfleSUmeFFT8YYGIC5FzrIDgACxAQAAvRCfVMq7ofhhIVE6zUE",
});

const MEDIA = Object.freeze({
  ANIMATIONS,
});

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
  CHART: { height: number; width: number };
};

function getCfg(): ICfg {
  const cfg = {} as ICfg;

  for (const e of requiredEnv) {
    if (e in process.env) {
      cfg[e] = process.env[e]!;
      continue;
    }
    throw new Error(`Bruh, fix your .env! Where's the ${e}?`);
  }
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
  cfg.CHART = { height: 640, width: 1280 };

  return Object.freeze(cfg);
}

const cfg = getCfg();

export default cfg;
