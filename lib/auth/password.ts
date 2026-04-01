import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function isStrongPassword(password: string) {
  // Minimal policy for the module; adjust to your needs.
  return password.length >= 8;
}

