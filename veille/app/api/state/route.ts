import { authed, json } from "@/lib/api";
import type { CollectSummary, SourceState } from "@/lib/collect";
import { kvGet, pool } from "@/lib/db";
import { counts } from "@/lib/items";
import { subscriptionCount, vapid } from "@/lib/push";
import { getSettings } from "@/lib/settings";
import { SOURCES } from "@/lib/sources";

export const GET = authed(async () => {
  const [settings, totals, lastRun, keys, devices] = await Promise.all([
    getSettings(),
    counts(),
    kvGet<CollectSummary>("lastRun"),
    vapid(),
    subscriptionCount(),
  ]);
  const states = await pool().query("SELECT key, value FROM veille.kv WHERE key LIKE 'source:%'");
  const byId = new Map<string, SourceState>(states.rows.map((r) => [r.key.slice(7), r.value]));
  return json({
    settings,
    counts: totals,
    lastRun: lastRun ?? null,
    push: { publicKey: keys.publicKey, devices },
    sources: SOURCES.map((s) => ({ id: s.id, name: s.name, lang: s.lang, kind: s.kind, state: byId.get(s.id) ?? null })),
  });
});
