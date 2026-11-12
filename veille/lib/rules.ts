import type { ParsedItem } from "./parse.ts";

export type Settings = {
  notify: { kev: boolean; certfrAlert: boolean; criticalCve: boolean; hotNews: boolean; keywords: boolean };
  keywords: string[];
  disabledSources: string[];
};

export const DEFAULT_SETTINGS: Settings = {
  notify: { kev: true, certfrAlert: true, criticalCve: true, hotNews: true, keywords: true },
  keywords: [],
  disabledSources: [],
};

export const CVSS_CRITICAL = 9;

/** Raisons pour lesquelles un élément est jugé critique. Sert au badge du fil et au choix des notifications. */
export type Reason = "kev" | "certfr-alert" | "cvss" | "hot" | `kw:${string}`;

const HOT_RE =
  /(zero[-\s]days?|0[-\s]days?|exploited in the wild|actively exploited|active(ly)? exploitation|under active (attack|exploitation)|activement exploitée?s?|exploitation active|exploitée?s? activement|emergency (patch|update|fix)|correctif d[’']urgence|patch d[’']urgence)/i;

export function keywordRegex(keyword: string): RegExp {
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  // Mot entier : « AD » ne doit pas correspondre à « upload ».
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "iu");
}

export function classify(item: ParsedItem, settings: Settings): Reason[] {
  const reasons: Reason[] = [];
  if (item.kind === "kev" || item.exploited) reasons.push("kev");
  if (item.source === "certfr-alerte") reasons.push("certfr-alert");
  if (item.cvss !== null && item.cvss >= CVSS_CRITICAL) reasons.push("cvss");
  const haystack = `${item.title}\n${item.summary}`;
  if ((item.kind === "news" || item.kind === "advisory") && HOT_RE.test(haystack)) reasons.push("hot");
  for (const kw of settings.keywords) {
    if (kw.trim() && keywordRegex(kw).test(haystack)) reasons.push(`kw:${kw.trim()}`);
  }
  return reasons;
}

/** Une raison donne-t-elle droit à une notification, compte tenu des réglages ? */
export function shouldNotify(reasons: string[], settings: Settings): boolean {
  return reasons.some((r) => {
    if (r === "kev") return settings.notify.kev;
    if (r === "certfr-alert") return settings.notify.certfrAlert;
    if (r === "cvss") return settings.notify.criticalCve;
    if (r === "hot") return settings.notify.hotNews;
    return r.startsWith("kw:") && settings.notify.keywords;
  });
}

export function normalizeSettings(input: unknown): Settings {
  const raw = (input ?? {}) as Partial<Settings>;
  const notify = { ...DEFAULT_SETTINGS.notify };
  for (const key of Object.keys(notify) as (keyof Settings["notify"])[]) {
    if (typeof raw.notify?.[key] === "boolean") notify[key] = raw.notify[key];
  }
  const clean = (list: unknown, maxLen: number, maxItems: number) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of Array.isArray(list) ? list : []) {
      if (typeof v !== "string") continue;
      const s = v.trim().replace(/\s+/g, " ").slice(0, maxLen);
      if (s.length < 2 || seen.has(s.toLowerCase())) continue;
      seen.add(s.toLowerCase());
      out.push(s);
      if (out.length >= maxItems) break;
    }
    return out;
  };
  return { notify, keywords: clean(raw.keywords, 60, 50), disabledSources: clean(raw.disabledSources, 60, 100) };
}
