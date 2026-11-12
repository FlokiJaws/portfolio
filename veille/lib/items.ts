import { pool, ready } from "./db";

export type Item = {
  id: number;
  source: string;
  kind: string;
  lang: string;
  title: string;
  url: string;
  summary: string;
  publishedAt: string;
  cvss: number | null;
  cves: string[];
  exploited: boolean;
  critical: boolean;
  reasons: string[];
  read: boolean;
  starred: boolean;
};

export type ItemQuery = {
  tab: "all" | "critical" | "starred";
  type: "all" | "vulns" | "news";
  lang: "all" | "fr" | "en";
  unread: boolean;
  q: string;
  cursor: string;
};

const COLUMNS = `id, source, kind, lang, title, url, summary, published_at AS "publishedAt", cvss, cves,
  exploited, critical, reasons, read, starred`;

export function parseQuery(params: URLSearchParams): ItemQuery {
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const v = params.get(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  };
  return {
    tab: pick("tab", ["all", "critical", "starred"] as const, "all"),
    type: pick("type", ["all", "vulns", "news"] as const, "all"),
    lang: pick("lang", ["all", "fr", "en"] as const, "all"),
    unread: params.get("unread") === "1",
    q: (params.get("q") ?? "").trim().slice(0, 100),
    cursor: params.get("cursor") ?? "",
  };
}

function where(query: ItemQuery, values: unknown[]): string[] {
  const clauses: string[] = [];
  if (query.tab === "critical") clauses.push("critical");
  if (query.tab === "starred") clauses.push("starred");
  if (query.type === "vulns") clauses.push("kind <> 'news'");
  if (query.type === "news") clauses.push("kind = 'news'");
  if (query.lang !== "all") {
    values.push(query.lang);
    clauses.push(`lang = $${values.length}`);
  }
  if (query.unread) clauses.push("NOT read");
  if (query.q) {
    values.push(`%${query.q.replace(/[\\%_]/g, "\\$&")}%`);
    const n = values.length;
    clauses.push(`(title ILIKE $${n} OR summary ILIKE $${n} OR array_to_string(cves, ' ') ILIKE $${n})`);
  }
  return clauses;
}

const PAGE = 30;

export async function listItems(query: ItemQuery): Promise<{ items: Item[]; nextCursor: string | null }> {
  await ready();
  const values: unknown[] = [];
  const clauses = where(query, values);
  // Curseur « date_id » : pagination stable même quand de nouveaux éléments arrivent en tête.
  const match = /^(\d{4}-[0-9T:.\-]+Z)_(\d+)$/.exec(query.cursor);
  if (match) {
    values.push(match[1], match[2]);
    clauses.push(`(published_at, id) < ($${values.length - 1}::timestamptz, $${values.length}::bigint)`);
  }
  values.push(PAGE + 1);
  const sql = `SELECT ${COLUMNS} FROM veille.items
    ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""}
    ORDER BY published_at DESC, id DESC LIMIT $${values.length}`;
  const rows = (await pool().query(sql, values)).rows.map(toItem);
  const items = rows.slice(0, PAGE);
  const last = items[items.length - 1];
  return { items, nextCursor: rows.length > PAGE && last ? `${last.publishedAt}_${last.id}` : null };
}

function toItem(row: Record<string, unknown>): Item {
  return { ...(row as unknown as Item), id: Number(row.id), publishedAt: (row.publishedAt as Date).toISOString() };
}

export async function getItem(id: number): Promise<Item | null> {
  await ready();
  const r = await pool().query(`SELECT ${COLUMNS} FROM veille.items WHERE id = $1`, [id]);
  return r.rows[0] ? toItem(r.rows[0]) : null;
}

export async function updateItem(id: number, patch: { read?: boolean; starred?: boolean }): Promise<Item | null> {
  await ready();
  const r = await pool().query(
    `UPDATE veille.items SET read = COALESCE($2, read), starred = COALESCE($3, starred) WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, patch.read ?? null, patch.starred ?? null],
  );
  return r.rows[0] ? toItem(r.rows[0]) : null;
}

export async function markAllRead(query: ItemQuery): Promise<number> {
  await ready();
  const values: unknown[] = [];
  const clauses = [...where({ ...query, unread: false }, values), "NOT read"];
  const r = await pool().query(`UPDATE veille.items SET read = TRUE WHERE ${clauses.join(" AND ")}`, values);
  return r.rowCount ?? 0;
}

export async function counts(): Promise<{ unread: number; criticalUnread: number; total: number }> {
  await ready();
  const r = await pool().query(
    `SELECT count(*) FILTER (WHERE NOT read)::int AS unread,
            count(*) FILTER (WHERE NOT read AND critical)::int AS "criticalUnread",
            count(*)::int AS total FROM veille.items`,
  );
  return r.rows[0];
}
