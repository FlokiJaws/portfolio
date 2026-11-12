import type { Item } from "./items";
import type { Settings } from "./rules.ts";
import { SOURCES } from "./sources.ts";

export type { Item, Settings };
export type Counts = { unread: number; criticalUnread: number; total: number };
export type SourceInfo = {
  id: string; name: string; lang: "fr" | "en"; kind: string;
  state: { lastRun: string; ok: boolean; error?: string; added: number } | null;
};
export type AppState = {
  settings: Settings;
  counts: Counts;
  lastRun: { startedAt: string; added: number; notified: number; errors: string[] } | null;
  push: { publicKey: string; devices: number };
  sources: SourceInfo[];
};

const NAMES = new Map(SOURCES.map((s) => [s.id, s.name]));
export const sourceName = (id: string) => NAMES.get(id) ?? id;

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401) {
    window.location.reload();
    throw new Error("Session expirée");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Erreur ${res.status}`);
  return data as T;
}

/** « 12 min », « 3 h », « hier », « 4 nov. » */
export function ago(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "à l’instant";
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export type Tag = { label: string; tone: "crit" | "kev" | "kw" | "plain"; mono?: boolean };

export function tagsFor(item: Item): Tag[] {
  const tags: Tag[] = [];
  if (item.exploited || item.kind === "kev") tags.push({ label: "Exploitée", tone: "kev" });
  if (item.reasons.includes("certfr-alert")) tags.push({ label: "Alerte", tone: "crit" });
  if (item.cvss !== null) tags.push({ label: `CVSS ${item.cvss.toFixed(1)}`, tone: item.cvss >= 9 ? "crit" : "plain" });
  if (item.reasons.includes("hot")) tags.push({ label: "Menace active", tone: "crit" });
  for (const r of item.reasons) if (r.startsWith("kw:")) tags.push({ label: r.slice(3), tone: "kw" });
  if (item.kind !== "cve" && item.cves.length > 0) {
    tags.push({ label: item.cves[0] + (item.cves.length > 1 ? ` +${item.cves.length - 1}` : ""), tone: "plain", mono: true });
  }
  return tags;
}

export function urlBase64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
