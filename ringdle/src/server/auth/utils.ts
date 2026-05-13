import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Hashes a plain-text password using scrypt with a random salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hashedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${hashedBuf.toString("hex")}.${salt}`;
}

/**
 * Verifies a plain-text password against a stored "hash.salt" hex string
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
