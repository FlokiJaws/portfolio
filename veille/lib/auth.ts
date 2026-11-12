import { createHmac, randomBytes, timingSafeEqual, scryptSync } from "node:crypto";
import { cookies } from "next/headers";
import { kvGetOrCreate } from "./db";

export const SESSION_COOKIE = "veille_session";
const SESSION_DAYS = 365;

async function secret(): Promise<string> {
  return kvGetOrCreate<string>("sessionSecret", () => randomBytes(32).toString("hex"));
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function equal(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function passwordConfigured(): boolean {
  return Boolean(process.env.VEILLE_PASSWORD && process.env.VEILLE_PASSWORD.length >= 8);
}

export function checkPassword(candidate: string): boolean {
  if (!passwordConfigured()) return false;
  // Dérivation avant comparaison : durée constante quelle que soit la longueur saisie.
  const salt = "veille-login";
  const a = scryptSync(candidate, salt, 32);
  const b = scryptSync(process.env.VEILLE_PASSWORD as string, salt, 32);
  return timingSafeEqual(a, b);
}

export async function createSessionCookie() {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  const payload = String(expires);
  return {
    name: SESSION_COOKIE,
    value: `${payload}.${sign(payload, await secret())}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  if (!equal(signature, sign(payload, await secret()))) return false;
  return Number(payload) > Date.now();
}

// Anti force brute : 8 essais par adresse et par quart d'heure (mémoire du processus, suffisant pour un seul conteneur).
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (attempts.size > 5000) attempts.clear();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 8;
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}
