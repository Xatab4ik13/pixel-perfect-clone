// Server-only database layer: a single lazily-created postgres connection pool
// wrapped by drizzle-orm. Reused across requests via a module-level singleton.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env.server";
import * as schema from "./schema";

let _db: ReturnType<typeof createDb> | undefined;

function createDb() {
  const client = postgres(env.databaseUrl(), {
    max: Number(process.env["DATABASE_POOL_MAX"] ?? 10),
    // Tune for serverless/long-lived server; keep modest defaults for 1000 users.
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(client, { schema });
}

/** Lazily-initialised drizzle client. Import only from server code. */
export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}

export { schema };
