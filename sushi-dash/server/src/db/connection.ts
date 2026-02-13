/**
 * db/connection.ts — PostgreSQL connection pool
 *
 * Creates a reusable pool using the pg driver.
 * All queries should use the helper `query()` / `execute()` exported here.
 */

import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "sushi_dash",
  max: 10,
});

/** Convert positional parameters from MariaDB (?) to PostgreSQL ($1, $2, etc.) */
function convertParams(sql: string, params?: unknown[]): [string, unknown[]] {
  if (!params || params.length === 0) return [sql, []];
  
  let index = 1;
  const convertedSql = sql.replace(/\?/g, () => `$${index++}`);
  return [convertedSql, params];
}

/** Run a parameterised query and return rows */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const [convertedSql, convertedParams] = convertParams(sql, params);
  const result = await pool.query(convertedSql, convertedParams);
  return result.rows as T[];
}

/** Run a parameterised statement (INSERT/UPDATE/DELETE) */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<{ affectedRows: number; insertId: number }> {
  const [convertedSql, convertedParams] = convertParams(sql, params);

  // Auto-append RETURNING id to simple INSERT statements (not upserts) so we get the new row's id
  let finalSql = convertedSql;
  if (
    /^\s*INSERT\s/i.test(finalSql) &&
    !/RETURNING/i.test(finalSql) &&
    !/ON\s+CONFLICT/i.test(finalSql)
  ) {
    finalSql += " RETURNING id";
  }

  const result = await pool.query(finalSql, convertedParams);
  return {
    affectedRows: result.rowCount ?? 0,
    insertId: result.rows?.[0]?.id ?? 0,
  };
}

/** Get a raw connection for transactions */
export async function getConnection() {
  return await pool.connect();
}

export default pool;
