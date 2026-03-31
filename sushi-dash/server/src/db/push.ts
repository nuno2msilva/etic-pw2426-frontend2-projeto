import "dotenv/config";
import { execSync } from "child_process";

// Use DIRECT_URL for DDL commands — PgBouncer (port 6543) hangs on schema changes.
process.env.DATABASE_URL = process.env["DIRECT_URL"] || process.env["DATABASE_URL"];

execSync("npx prisma db push", { stdio: "inherit", env: process.env });
