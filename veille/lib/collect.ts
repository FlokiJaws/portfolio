import { kvGet, kvSet, pool, ready } from "./db";
import { parseFeed, parseKev, parseNvd, type ParsedItem } from "./parse.ts";
import { sendPush, type PushPayload } from "./push";
import { classify, CVSS_CRITICAL, shouldNotify, type Settings } from "./rules.ts";
import { getSettings } from "./settings";
import { SOURCE_BY_ID, SOURCES, type Source } from "./sources.ts";

const DAY = 86_400_000;
const MAX_AGE_DAYS = 45; // on n'importe pas plus ancien
const NOTIFY_MAX_AGE = 3 * DAY; // on ne notifie pas un élément déjà vieux
const RETENTION_DAYS = 90;
const USER_AGENT = "Mozilla/5.0 (compatible; VeilleCyber/1.0; lecteur de flux personnel)";

export type SourceState = { lastRun: string; ok: boolean; error?: string; added: number; seeded: boolean; lastModEnd?: string };
type Inserted = { id: number; item: ParsedItem; reasons: string[] };

async function fetchText(url: string, headers: Record<string, string> = {}): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/xml, application/json, */*", ...headers },
    signal: AbortSignal.timeout(30_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  if (body.length > 25_000_000) throw new Error("réponse trop volumineuse");
  return body;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchNvd(source: Source, state: SourceState | undefined, now: Date): Promise<{ items: ParsedItem[]; lastModEnd: string }> {
  // On suit les CVE *modifiées* depuis le dernier passage : le score arrive souvent après la publication.
  const fallback = now.getTime() - 3 * DAY;
  const previous = state?.lastModEnd ? new Date(state.lastModEnd).getTime() - 10 * 60_000 : fallback;
  const start = new Date(Math.max(Number.isFinite(previous) ? previous : fallback, now.getTime() - 100 * DAY));
  const headers: Record<string, string> = process.env.NVD_API_KEY ? { apiKey: process.env.NVD_API_KEY } : {};
  const items: ParsedItem[] = [];
  const pageSize = 2000;
  for (let page = 0; page < 6; page++) {
    const qs = new URLSearchParams({
      lastModStartDate: start.toISOString(),
      lastModEndDate: now.toISOString(),
      resultsPerPage: String(pageSize),
      startIndex: String(page * pageSize),
    });
    const json = JSON.parse(await fetchText(`${source.url}?${qs}`, headers));
    items.push(...parseNvd(json, source, CVSS_CRITICAL, now));
    if ((page + 1) * pageSize >= Number(json.totalResults ?? 0)) break;
    await sleep(6500); // limite NVD sans clé : 5 requêtes / 30 s
  }
  return { items, lastModEnd: now.toISOString() };
}

async function insertItems(source: Source, items: ParsedItem[], settings: Settings, seed: boolean): Promise<Inserted[]> {
  const inserted: Inserted[] = [];
  const db = pool();
  for (const item of items) {
    const reasons = classify(item, settings);
    const params = [
      item.uid, item.source, item.kind, item.lang, item.title, item.url, item.summary,
      item.publishedAt, item.cvss, item.cves, item.exploited, reasons.length > 0, reasons, seed,
    ];
    // Les CVE NVD sont réévaluées : on met à jour le score sans toucher à l'état lu/favori/notifié.
    const onConflict =
      source.type === "nvd"
        ? `DO UPDATE SET cvss = EXCLUDED.cvss, summary = EXCLUDED.summary,
             exploited = veille.items.exploited OR EXCLUDED.exploited`
        : "DO NOTHING";
    const r = await db.query(
      `INSERT INTO veille.items
         (uid, source, kind, lang, title, url, summary, published_at, cvss, cves, exploited, critical, reasons, notified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (uid) ${onConflict}
       RETURNING id, (xmax = 0) AS is_new`,
      params,
    );
    if (r.rows[0]?.is_new) inserted.push({ id: Number(r.rows[0].id), item, reasons });
    if (item.kind === "kev" && r.rows[0]?.is_new) {
      // Une CVE déjà présente dans le fil devient « exploitée » quand elle entre au catalogue KEV.
      await db.query(
        `UPDATE veille.items SET exploited = TRUE, critical = TRUE,
                reasons = CASE WHEN 'kev' = ANY(reasons) THEN reasons ELSE array_append(reasons, 'kev') END
         WHERE kind = 'cve' AND cves && $1::text[]`,
        [item.cves],
      );
    }
  }
  return inserted;
}

async function collectSource(source: Source, settings: Settings, now: Date): Promise<{ state: SourceState; inserted: Inserted[]; seed: boolean }> {
  const key = `source:${source.id}`;
  const previous = await kvGet<SourceState>(key);
  // Premier passage réussi d'une source : on remplit le fil sans notifier tout l'historique.
  const seed = !previous?.seeded;
  try {
    let items: ParsedItem[];
    let lastModEnd = previous?.lastModEnd;
    if (source.type === "kev") items = parseKev(JSON.parse(await fetchText(source.url)), source, now);
    else if (source.type === "nvd") ({ items, lastModEnd } = await fetchNvd(source, previous, now));
    else items = parseFeed(await fetchText(source.url), source, now);

    const cutoff = now.getTime() - MAX_AGE_DAYS * DAY;
    const fresh = items.filter((i) => i.publishedAt.getTime() >= cutoff);
    const inserted = await insertItems(source, fresh, settings, seed);
    const state: SourceState = { lastRun: now.toISOString(), ok: true, added: inserted.length, seeded: true, lastModEnd };
    await kvSet(key, state);
    return { state, inserted, seed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const state: SourceState = {
      lastRun: now.toISOString(), ok: false, error: message.slice(0, 200), added: 0,
      seeded: previous?.seeded ?? false, lastModEnd: previous?.lastModEnd,
    };
    await kvSet(key, state);
    console.error(`[veille] ${source.id} : ${message}`);
    return { state, inserted: [], seed };
  }
}

function priority(c: Inserted): number {
  if (c.item.kind === "kev") return 0;
  if (c.reasons.includes("certfr-alert")) return 1;
  if (c.reasons.some((r) => r.startsWith("kw:"))) return 2;
  if (c.reasons.includes("kev")) return 3;
  if (c.reasons.includes("hot")) return 4;
  return 5;
}

export function buildPayload(c: Inserted): PushPayload {
  const { item, reasons } = c;
  const sourceName = SOURCE_BY_ID.get(item.source)?.name ?? item.source;
  const url = `/?item=${c.id}`;
  const tag = `item-${c.id}`;
  const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
  if (item.kind === "kev") return { title: `Exploitée activement · ${item.cves[0]}`, body: cut(item.title, 160), url, tag };
  if (reasons.includes("certfr-alert")) return { title: "Alerte CERT-FR", body: cut(item.title, 180), url, tag };
  const kw = reasons.find((r) => r.startsWith("kw:"));
  if (kw) return { title: `« ${kw.slice(3)} » · ${sourceName}`, body: cut(item.kind === "cve" ? `${item.title} — ${item.summary}` : item.title, 180), url, tag };
  if (item.kind === "cve") return { title: `${item.title} · CVSS ${item.cvss?.toFixed(1)}`, body: cut(item.summary, 180), url, tag };
  return { title: sourceName, body: cut(item.title, 180), url, tag };
}

async function notify(candidates: Inserted[], settings: Settings, now: Date): Promise<number> {
  const eligible = candidates
    .filter((c) => shouldNotify(c.reasons, settings) && now.getTime() - c.item.publishedAt.getTime() <= NOTIFY_MAX_AGE)
    .sort((a, b) => priority(a) - priority(b) || b.item.publishedAt.getTime() - a.item.publishedAt.getTime());

  // Une même faille est reprise par plusieurs sources : une seule notification par CVE sur 7 jours,
  // sauf pour une entrée KEV ou une alerte CERT-FR, qui apportent une information nouvelle.
  const db = pool();
  const seenCves = new Set<string>();
  const toSend: Inserted[] = [];
  for (const c of eligible) {
    const always = c.item.kind === "kev" || c.reasons.includes("certfr-alert");
    if (!always && c.item.cves.length > 0) {
      if (c.item.cves.some((cve) => seenCves.has(cve))) continue;
      const dup = await db.query(
        "SELECT 1 FROM veille.items WHERE notified AND id <> $1 AND cves && $2::text[] AND created_at > now() - interval '7 days' LIMIT 1",
        [c.id, c.item.cves],
      );
      if (dup.rowCount) continue;
    }
    c.item.cves.forEach((cve) => seenCves.add(cve));
    toSend.push(c);
  }
  if (toSend.length === 0) return 0;

  const unread = await db.query("SELECT count(*)::int AS n FROM veille.items WHERE critical AND NOT read");
  const badge: number = unread.rows[0].n;

  // Au-delà de 3 éléments dans le même passage, on regroupe pour ne pas inonder l'écran verrouillé.
  const individual = toSend.length <= 3 ? toSend : toSend.slice(0, 2);
  const rest = toSend.slice(individual.length);
  for (const c of individual) await sendPush({ ...buildPayload(c), badge });
  if (rest.length > 0) {
    const titles = rest.map((c) => (c.item.kind === "cve" ? c.item.title : c.item.title.length > 60 ? c.item.title.slice(0, 59).trimEnd() + "…" : c.item.title)).join(" · ");
    await sendPush({
      title: `${rest.length} autres éléments critiques`,
      body: titles.length > 180 ? titles.slice(0, 179) + "…" : titles,
      url: "/?tab=critical",
      tag: `digest-${now.getTime()}`,
      badge,
    });
  }
  await db.query("UPDATE veille.items SET notified = TRUE WHERE id = ANY($1::bigint[])", [toSend.map((c) => c.id)]);
  return toSend.length;
}

export type CollectSummary = { startedAt: string; added: number; notified: number; errors: string[] };

const globalForCollect = globalThis as unknown as { veilleRun?: Promise<CollectSummary> };

/** Un passage complet sur toutes les sources. Les appels concurrents partagent le même passage. */
export function collectAll(): Promise<CollectSummary> {
  if (!globalForCollect.veilleRun) {
    globalForCollect.veilleRun = run().finally(() => {
      globalForCollect.veilleRun = undefined;
    });
  }
  return globalForCollect.veilleRun;
}

async function run(): Promise<CollectSummary> {
  await ready();
  const now = new Date();
  const settings = await getSettings();
  const enabled = SOURCES.filter((s) => !settings.disabledSources.includes(s.id));
  const results = await Promise.all(enabled.map((s) => collectSource(s, settings, now)));

  const candidates = results.filter((r) => !r.seed).flatMap((r) => r.inserted);
  let notified = 0;
  try {
    notified = await notify(candidates, settings, now);
  } catch (err) {
    console.error("[veille] notification :", (err as Error).message);
  }
  await pool().query(`DELETE FROM veille.items WHERE NOT starred AND published_at < now() - interval '${RETENTION_DAYS} days'`);

  const summary: CollectSummary = {
    startedAt: now.toISOString(),
    added: results.reduce((n, r) => n + r.inserted.length, 0),
    notified,
    errors: enabled.filter((_, i) => !results[i].state.ok).map((s) => s.id),
  };
  await kvSet("lastRun", summary);
  console.log(`[veille] collecte : +${summary.added} éléments, ${summary.notified} notifiés, ${summary.errors.length} sources en erreur`);
  return summary;
}

export function startScheduler(): void {
  const g = globalThis as unknown as { veilleTimer?: NodeJS.Timeout };
  if (g.veilleTimer) return;
  const minutes = Math.max(5, Number(process.env.VEILLE_INTERVAL_MIN) || 15);
  const tick = () => collectAll().catch((err) => console.error("[veille] collecte échouée :", err.message));
  setTimeout(tick, 8_000);
  g.veilleTimer = setInterval(tick, minutes * 60_000);
}
