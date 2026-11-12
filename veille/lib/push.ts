import webpush from "web-push";
import { kvGetOrCreate, pool, ready } from "./db";

export type PushPayload = { title: string; body: string; url: string; tag: string; badge?: number };

type Vapid = { publicKey: string; privateKey: string };

/** Les clés VAPID sont générées au premier démarrage et gardées en base : rien à configurer. */
export async function vapid(): Promise<Vapid> {
  return kvGetOrCreate<Vapid>("vapid", () => webpush.generateVAPIDKeys());
}

function subject(): string {
  // Apple refuse les sujets VAPID invalides (localhost, adresse factice) : on donne l'URL publique de l'app.
  return process.env.VEILLE_URL || "https://veille.marleyportfolio.fr";
}

export async function subscriptionCount(): Promise<number> {
  await ready();
  const r = await pool().query("SELECT count(*)::int AS n FROM veille.push_subscriptions");
  return r.rows[0].n;
}

/** Envoie à tous les appareils abonnés. Retourne le nombre d'envois acceptés. */
export async function sendPush(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  await ready();
  const subs = await pool().query("SELECT endpoint, p256dh, auth FROM veille.push_subscriptions");
  if (subs.rowCount === 0) return { sent: 0, failed: 0 };
  const keys = await vapid();
  let sent = 0;
  let failed = 0;
  await Promise.all(
    subs.rows.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          {
            vapidDetails: { subject: subject(), publicKey: keys.publicKey, privateKey: keys.privateKey },
            TTL: 12 * 3600,
            urgency: "high",
            timeout: 15_000,
          },
        );
        sent++;
      } catch (err) {
        failed++;
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410 : l'appareil s'est désabonné (app supprimée, permission retirée).
        if (status === 404 || status === 410) {
          await pool().query("DELETE FROM veille.push_subscriptions WHERE endpoint = $1", [s.endpoint]);
        } else {
          console.error("[veille] push échoué", status ?? (err as Error).message);
        }
      }
    }),
  );
  return { sent, failed };
}

// Seuls les services push connus sont acceptés, pour que le serveur ne puisse pas être
// utilisé pour envoyer des requêtes vers une adresse arbitraire.
const PUSH_HOSTS = [/\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];

export function isAllowedPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > 2000) return false;
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && PUSH_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}
