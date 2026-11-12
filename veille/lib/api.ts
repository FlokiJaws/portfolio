import { NextResponse } from "next/server";
import { isAuthenticated } from "./auth";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Enveloppe une route : session exigée, et erreurs renvoyées en JSON plutôt qu'en page HTML. */
export function authed<A extends unknown[]>(handler: (req: Request, ...args: A) => Promise<Response>) {
  return async (req: Request, ...args: A): Promise<Response> => {
    try {
      if (!(await isAuthenticated())) return json({ error: "Non connecté" }, 401);
      return await handler(req, ...args);
    } catch (err) {
      console.error("[veille] api", req.method, new URL(req.url).pathname, (err as Error).message);
      return json({ error: "Erreur serveur" }, 500);
    }
  };
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const data = await req.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
