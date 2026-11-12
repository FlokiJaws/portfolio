import { authed, body, json } from "@/lib/api";
import { pool, ready } from "@/lib/db";
import { isAllowedPushEndpoint } from "@/lib/push";

export const POST = authed(async (req) => {
  const data = await body(req);
  const keys = (data.keys ?? {}) as Record<string, unknown>;
  if (!isAllowedPushEndpoint(data.endpoint) || typeof keys.p256dh !== "string" || typeof keys.auth !== "string") {
    return json({ error: "Abonnement invalide" }, 400);
  }
  await ready();
  await pool().query(
    `INSERT INTO veille.push_subscriptions (endpoint, p256dh, auth, label) VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
    [data.endpoint, keys.p256dh.slice(0, 200), keys.auth.slice(0, 100), (req.headers.get("user-agent") ?? "").slice(0, 200)],
  );
  return json({ ok: true });
});

export const DELETE = authed(async (req) => {
  const data = await body(req);
  if (typeof data.endpoint !== "string") return json({ error: "Abonnement invalide" }, 400);
  await ready();
  await pool().query("DELETE FROM veille.push_subscriptions WHERE endpoint = $1", [data.endpoint]);
  return json({ ok: true });
});
