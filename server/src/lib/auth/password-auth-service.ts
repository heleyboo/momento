import { sql, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, settings } from "@/db/schema";
import { hashPassword, verifyPassword } from "./password-hash";
import type { SessionUser } from "./auth-service";

// Email/password registration + login. Email is matched case-insensitively and
// stored lowercased. Errors are intentionally generic to avoid user enumeration.

export class AuthError extends Error {}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerWithPassword(
  email: string,
  password: string,
  name?: string,
): Promise<SessionUser> {
  const normalized = normalizeEmail(email);
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${normalized}`)
    .limit(1);
  if (existing) throw new AuthError("email already registered");

  const passwordHash = await hashPassword(password);
  const [row] = await db
    .insert(users)
    .values({ email: normalized, name: name ?? null, passwordHash })
    .returning();

  await db.insert(settings).values({ userId: row.id }).onConflictDoNothing();
  return { id: row.id, email: row.email, name: row.name, avatarUrl: row.avatarUrl };
}

export async function loginWithPassword(email: string, password: string): Promise<SessionUser> {
  const normalized = normalizeEmail(email);
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalized}`)
    .limit(1);
  if (!row?.passwordHash || !(await verifyPassword(password, row.passwordHash))) {
    throw new AuthError("invalid email or password");
  }
  return { id: row.id, email: row.email, name: row.name, avatarUrl: row.avatarUrl };
}
