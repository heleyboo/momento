import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Password hashing with scrypt (no external dependency). Stored as `salt:hash`.
const scrypt = promisify(_scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = await scrypt(password, salt, 64);
  const hashBuf = Buffer.from(hash, "hex");
  // Constant-time compare; length guard avoids timingSafeEqual throwing.
  return hashBuf.length === derived.length && timingSafeEqual(hashBuf, derived);
}
