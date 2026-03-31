import "dotenv/config";
import { execSync } from "child_process";

// Use DIRECT_URL for DDL commands — PgBouncer (port 6543) hangs on schema changes.
process.env.DATABASE_URL = process.env["DIRECT_URL"] || process.env["DATABASE_URL"];

execSync("npx prisma db push --force-reset", { stdio: "inherit", env: process.env });
execSync("tsx src/db/seed.ts", { stdio: "inherit", env: process.env });
