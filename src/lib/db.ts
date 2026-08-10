import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "db",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "west_user",
      password: process.env.DB_PASSWORD || "west_password",
      database: process.env.DB_NAME || "west_db",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}
