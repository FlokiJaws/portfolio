import { NextResponse } from "next/server";
import { checkPassword, clearAttempts, createSessionCookie, passwordConfigured, rateLimited } from "@/lib/auth";
import { body, json } from "@/lib/api";

export async function POST(req: Request) {
  if (!passwordConfigured()) {
    return json({ error: "Mot de passe non configuré côté serveur (VEILLE_PASSWORD, 8 caractères minimum)." }, 503);
  }
  // Derrière Caddy, la dernière adresse de X-Forwarded-For est celle vue par le proxy (non falsifiable par le client).
  const ip = req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "local";
  if (rateLimited(ip)) return json({ error: "Trop d'essais. Réessaie dans 15 minutes." }, 429);
  const { password } = await body(req);
  if (typeof password !== "string" || password.length > 200 || !checkPassword(password)) {
    return json({ error: "Mot de passe incorrect." }, 401);
  }
  clearAttempts(ip);
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(await createSessionCookie());
    return res;
  } catch (err) {
    console.error("[veille] login", (err as Error).message);
    return json({ error: "Base de données injoignable." }, 500);
  }
}
