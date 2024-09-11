import mysql from "mysql2/promise";

let pool: mysql.Pool;
async function getOldDbPool() {
  if (pool) {
    return pool;
  }
  pool = mysql.createPool({
    host: "0.0.0.0",
    user: "ulii",
    password: "myuliipassword",
    database: "soniashnyk_bot",
    typeCast: true,
  });
  await pool.query("SELECT 1");
  return pool;
}

export { getOldDbPool };
