import { Pool } from "pg";

// La connexion lit PGHOST / PGUSER / PGPASSWORD / PGDATABASE (variables standard de pg).
// Tout vit dans un schéma dédié « veille », à côté des tables Strapi sans y toucher.
const globalForDb = globalThis as unknown as { veillePool?: Pool; veilleReady?: Promise<void> };

export function pool(): Pool {
  if (!globalForDb.veillePool) {
    globalForDb.veillePool = new Pool({ max: 5, idleTimeoutMillis: 30_000 });
    globalForDb.veillePool.on("error", (err) => console.error("[veille] pg pool error", err.message));
  }
  return globalForDb.veillePool;
}

const SCHEMA_SQL = `
CREATE SCHEMA IF NOT EXISTS veille;

CREATE TABLE IF NOT EXISTS veille.items (
  id           BIGSERIAL PRIMARY KEY,
  uid          TEXT NOT NULL UNIQUE,
  source       TEXT NOT NULL,
  kind         TEXT NOT NULL,
  lang         TEXT NOT NULL,
  title        TEXT NOT NULL,
  url          TEXT NOT NULL,
  summary      TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL,
  cvss         REAL,
  cves         TEXT[] NOT NULL DEFAULT '{}',
  exploited    BOOLEAN NOT NULL DEFAULT FALSE,
  critical     BOOLEAN NOT NULL DEFAULT FALSE,
  reasons      TEXT[] NOT NULL DEFAULT '{}',
  read         BOOLEAN NOT NULL DEFAULT FALSE,
  starred      BOOLEAN NOT NULL DEFAULT FALSE,
  notified     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS items_feed_idx ON veille.items (published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS items_critical_idx ON veille.items (published_at DESC, id DESC) WHERE critical;
CREATE INDEX IF NOT EXISTS items_cves_idx ON veille.items USING GIN (cves);

CREATE TABLE IF NOT EXISTS veille.push_subscriptions (
  endpoint   TEXT PRIMARY KEY,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  label      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS veille.kv (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
`;

/** Crée le schéma au premier appel (idempotent). */
export function ready(): Promise<void> {
  if (!globalForDb.veilleReady) {
    globalForDb.veilleReady = pool()
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch((err) => {
        globalForDb.veilleReady = undefined;
        throw err;
      });
  }
  return globalForDb.veilleReady;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  await ready();
  const r = await pool().query("SELECT value FROM veille.kv WHERE key = $1", [key]);
  return r.rows[0]?.value as T | undefined;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await ready();
  await pool().query(
    "INSERT INTO veille.kv (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [key, JSON.stringify(value)],
  );
}

/** Lit une valeur, ou la crée une seule fois (sûr même si deux requêtes arrivent en même temps). */
export async function kvGetOrCreate<T>(key: string, create: () => T): Promise<T> {
  const existing = await kvGet<T>(key);
  if (existing !== undefined) return existing;
  await pool().query(
    "INSERT INTO veille.kv (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING",
    [key, JSON.stringify(create())],
  );
  return (await kvGet<T>(key)) as T;
}
