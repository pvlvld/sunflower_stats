import dotenv from "dotenv";
dotenv.config();

type ICfg = Record<(typeof requiredEnv)[number], string> & {
  ADMINS: number[];
  STATUSES: { LEFT_STATUSES: string[] };
};

const requiredEnv = ["BOT_TOKEN", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_DATABASE"] as const;

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

  return Object.freeze(cfg);
}

const cfg = getCfg();

export default cfg;
