import { Pool } from "pg";
import { GroupTextContext } from "../../types/context";
import YAMLWrapper from "../../data/YAMLWrapper";
import IActive from "../../data/active";
import Database, { SqliteError } from "better-sqlite3";

const types = ["pg", "lite"] as const;

type IOptions = {
  type: (typeof types)[number];
  operations: number;
  threads: number;
  ids_range: number;
};

async function bench_db_cmd(
  ctx: GroupTextContext,
  active: YAMLWrapper<IActive>,
  options = {} as IOptions
) {
  const args = (ctx.msg?.text ?? ctx.msg?.caption)?.split(" ");
  if (types.includes(args[1] as (typeof types)[number])) {
    options.type = args[1] as (typeof types)[number];
  } else {
    return void (await ctx.reply(`Select type: ${types.join(" or ")}`));
  }
  options.operations = parseInt(args[2] || "100");
  options.threads = parseInt(args[3] || "10");
  options.ids_range = parseInt(args[4] || "50");

  const chatUserIdPairs = convertIActiveToArray(active.data, options.ids_range);

  const start = Date.now();

  if (options.type === "pg") {
    await pg(chatUserIdPairs, options);
  } else {
    await lite(chatUserIdPairs, options);
  }

  ctx.reply(
    `${options.type === "lite" ? "sqlite" : "postgresql"}\n\nInsert: ${
      options.operations / (Date.now() - start)
    }ops/ms\nOperations: ${options.operations}\nConnections: ${options.threads}\nDataset: ${
      options.ids_range
    } chat-user pairs`
  );
}

async function pg(chatUserIdPairs: ReturnType<typeof convertIActiveToArray>, options: IOptions) {
  try {
    const pool = new Pool({
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: options.threads,
    });

    void (await pool.query("SELECT 1"));

    let pair: ReturnType<typeof getRandomChatUserPair> = [] as any;
    for (let i = 0; i < options.operations; i++) {
      pair = getRandomChatUserPair(chatUserIdPairs);
      const connection = await pool.connect();
      connection
        .query(
          `INSERT INTO public.stats_day_statistics_test (chat_id, user_id)
          VALUES (${pair[0]}, ${pair[1]})
          ON CONFLICT (chat_id, user_id, date) DO UPDATE SET count = stats_day_statistics_test.count + 1;`
        )
        .then(() => {
          connection.release();
        });
    }

    pool.end();
  } catch (error) {
    console.log(error);
  }
}

async function lite(chatUserIdPairs: ReturnType<typeof convertIActiveToArray>, options: IOptions) {
  try {
    const db = new Database("test_active.db", { fileMustExist: false });
    db.pragma("journal_mode = WAL");

    db.exec(`CREATE TABLE IF NOT EXISTS test_active (
      chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      CONSTRAINT unique_chat_user_date UNIQUE (chat_id, user_id, date)
    );`);

    void db.exec("SELECT 1 FROM test_active");

    function upsertData(pair: [chatId: number | string, userId: number | string]) {
      try {
        db.prepare(
          "INSERT INTO test_active(chat_id, user_id, count) VALUES(?, ?, 1) ON CONFLICT DO UPDATE SET count = count+1"
        ).run(pair[0], pair[1]);
        // !ssbdb lite 10 1 10
      } catch (error: unknown) {
        console.error(error);
      }
    }

    for (let i = 0; i < options.operations; i++) {
      upsertData(getRandomChatUserPair(chatUserIdPairs));
    }
  } catch (error) {
    console.log(error);
  }
}

function getRandomChatUserPair(chatUserIdPairs: ReturnType<typeof convertIActiveToArray>) {
  return chatUserIdPairs[Math.floor(Math.random() * chatUserIdPairs.length)];
}

function convertIActiveToArray(
  data: IActive,
  size: number
): Array<[string | number, string | number]> {
  const result: Array<[string | number, string | number]> = [];

  let current_size = 0;
  outter: for (const chatId in data) {
    for (const userId in data[chatId]) {
      result.push([chatId, userId]);
      current_size++;
      if (current_size >= size) {
        break outter;
      }
    }
  }

  return result;
}

export default bench_db_cmd;
