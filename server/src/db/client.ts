import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://momento:momento@localhost:5433/momento";

// Single shared pooled client. `postgres` lazily connects on first query.
const queryClient = postgres(connectionString, { max: 10 });

export const db = drizzle(queryClient, { schema });
export { schema };
