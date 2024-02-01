import mysql from "mysql2/promise";

if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_DATABASE ||
  !process.env.DB_CHARSET
) {
  throw new Error("Provide database env credentials.");
}

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: process.env.DB_CHARSET,
});

db.connect((err) => {
  if (err) throw err;
});

export default db;
