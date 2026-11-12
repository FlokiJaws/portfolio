import { XMLParser } from "fast-xml-parser";
import type { Kind, Lang, Source } from "./sources.ts";

export type ParsedItem = {
  uid: string;
  source: string;
  kind: Kind;
  lang: Lang;
  title: string;
  url: string;
  summary: string;
  publishedAt: Date;
  cvss: number | null;
  cves: string[];
  exploited: boolean;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", laquo: "«", raquo: "»", ndash: "–", mdash: "—", eacute: "é", egrave: "è",
  ecirc: "ê", agrave: "à", acirc: "â", ccedil: "ç", ocirc: "ô", ugrave: "ù", ucirc: "û", icirc: "î",
  iuml: "ï", euml: "ë", Eacute: "É", Egrave: "È", Agrave: "À", Ccedil: "Ç", oelig: "œ", euro: "€", deg: "°",
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
      // Pas de caractères de contrôle dans le texte affiché.
      if (code < 32 && code !== 10) return " ";
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body] ?? NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

/** HTML de flux → texte brut sur une ligne. Le résultat n'est jamais réinjecté comme HTML. */
export function toText(input: unknown, max = 600): string {
  if (input == null) return "";
  let s = String(input);
  // Les flux encodent souvent le HTML deux fois (&lt;p&gt;) : on décode puis on retire les balises.
  s = decodeEntities(s);
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ");
  s = decodeEntities(s).replace(/\s+/g, " ").trim();
  // Formules de fin ajoutées par WordPress ("The post X appeared first on Y", "L'article … est apparu en premier sur …").
  s = s.replace(/\s*(The post .* appeared first on .*|L[’']article .* est apparu en premier sur .*)$/i, "").trim();
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, "") + "…";
  return s;
}

const CVE_RE = /CVE-\d{4}-\d{4,7}/gi;

export function extractCves(...texts: string[]): string[] {
  const found = new Set<string>();
  for (const t of texts) for (const m of t.match(CVE_RE) ?? []) found.add(m.toUpperCase());
  return [...found].slice(0, 30);
}

export function safeHttpUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  try {
    const u = new URL(input.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function parseDate(input: unknown, now: Date): Date {
  const d = input ? new Date(String(input)) : new Date(NaN);
  if (Number.isNaN(d.getTime())) return now;
  // Un flux mal réglé ne doit pas épingler un article dans le futur en haut du fil.
  return d.getTime() > now.getTime() ? now : d;
}

type XmlNode = Record<string, unknown>;

function text(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return text(node[0]);
  const obj = node as XmlNode;
  return typeof obj["#text"] === "string" || typeof obj["#text"] === "number" ? String(obj["#text"]) : "";
}

function atomLink(link: unknown): string {
  const links = Array.isArray(link) ? link : [link];
  let fallback = "";
  for (const l of links) {
    if (typeof l === "string") { fallback ||= l; continue; }
    const obj = (l ?? {}) as XmlNode;
    const href = typeof obj["@_href"] === "string" ? (obj["@_href"] as string) : "";
    if (!href) continue;
    if (!obj["@_rel"] || obj["@_rel"] === "alternate") return href;
    fallback ||= href;
  }
  return fallback;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}

/** RSS 2.0 / RDF / Atom → éléments normalisés. */
export function parseFeed(xml: string, source: Source, now = new Date()): ParsedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // Les entités sont décodées par toText() : évite les limites d'expansion du parseur.
    processEntities: false,
    parseTagValue: false,
    trimValues: true,
  });
  const doc = parser.parse(xml) as XmlNode;
  const rss = doc.rss as XmlNode | undefined;
  const rdf = doc["rdf:RDF"] as XmlNode | undefined;
  const feed = doc.feed as XmlNode | undefined;

  let entries: XmlNode[] = [];
  if (rss?.channel) entries = asArray((rss.channel as XmlNode).item as XmlNode | XmlNode[]);
  else if (rdf) entries = asArray(rdf.item as XmlNode | XmlNode[]);
  else if (feed) entries = asArray(feed.entry as XmlNode | XmlNode[]);
  else throw new Error("format de flux non reconnu");

  const out: ParsedItem[] = [];
  for (const e of entries.slice(0, 80)) {
    const rawLink = feed ? atomLink(e.link) : text(e.link) || atomLink(e.link);
    const url = safeHttpUrl(decodeEntities(rawLink));
    const title = toText(text(e.title), 300);
    if (!url || !title) continue;
    const body = text(e.description) || text(e.summary) || text(e["content:encoded"]) || text(e.content);
    const summary = toText(body);
    const guid = text(e.guid) || text(e.id) || url;
    out.push({
      uid: `${source.id}:${guid}`.slice(0, 500),
      source: source.id,
      kind: source.kind,
      lang: source.lang,
      title,
      url,
      summary: summary === title ? "" : summary,
      publishedAt: parseDate(text(e.pubDate) || text(e["dc:date"]) || text(e.published) || text(e.updated), now),
      cvss: null,
      cves: extractCves(title, toText(body, 20_000)),
      exploited: false,
    });
  }
  return out;
}

type KevEntry = {
  cveID?: string; vendorProject?: string; product?: string; vulnerabilityName?: string;
  dateAdded?: string; shortDescription?: string; requiredAction?: string; dueDate?: string;
  knownRansomwareCampaignUse?: string;
};

/** Catalogue CISA KEV (failles exploitées activement). */
export function parseKev(json: unknown, source: Source, now = new Date()): ParsedItem[] {
  const list = (json as { vulnerabilities?: KevEntry[] })?.vulnerabilities;
  if (!Array.isArray(list)) throw new Error("catalogue KEV invalide");
  const out: ParsedItem[] = [];
  for (const v of list) {
    const cve = typeof v.cveID === "string" ? v.cveID.toUpperCase() : "";
    if (!/^CVE-\d{4}-\d{4,7}$/.test(cve)) continue;
    const ransomware = v.knownRansomwareCampaignUse === "Known" ? " Utilisée par des rançongiciels." : "";
    const due = v.dueDate ? ` Échéance CISA : ${v.dueDate}.` : "";
    out.push({
      uid: `kev:${cve}`,
      source: source.id,
      kind: "kev",
      lang: source.lang,
      title: toText(v.vulnerabilityName || `${v.vendorProject ?? ""} ${v.product ?? ""}`.trim() || cve, 300),
      url: `https://nvd.nist.gov/vuln/detail/${cve}`,
      summary: toText(`${v.shortDescription ?? ""}${ransomware}${due}`, 700),
      // dateAdded est une date sans heure : midi UTC évite de reculer d'un jour selon le fuseau.
      publishedAt: parseDate(v.dateAdded ? `${v.dateAdded}T12:00:00Z` : "", now),
      cvss: null,
      cves: [cve],
      exploited: true,
    });
  }
  return out;
}

type NvdMetric = { type?: string; cvssData?: { baseScore?: number } };
type NvdCve = {
  id?: string; published?: string; vulnStatus?: string; cisaExploitAdd?: string;
  descriptions?: { lang?: string; value?: string }[];
  metrics?: Record<string, NvdMetric[]>;
};

/** Score retenu : la version CVSS la plus récente disponible, en préférant l'évaluation « Primary ». */
export function nvdScore(metrics: NvdCve["metrics"]): number | null {
  for (const key of ["cvssMetricV40", "cvssMetricV31", "cvssMetricV30"]) {
    const list = metrics?.[key];
    if (!Array.isArray(list) || list.length === 0) continue;
    const pick = list.find((m) => m.type === "Primary") ?? list[0];
    const score = pick?.cvssData?.baseScore;
    if (typeof score === "number" && score >= 0 && score <= 10) return score;
  }
  return null;
}

/** Réponse de l'API NVD 2.0 → CVE dont le score atteint le seuil. */
export function parseNvd(json: unknown, source: Source, minScore: number, now = new Date()): ParsedItem[] {
  const list = (json as { vulnerabilities?: { cve?: NvdCve }[] })?.vulnerabilities;
  if (!Array.isArray(list)) throw new Error("réponse NVD invalide");
  const out: ParsedItem[] = [];
  for (const entry of list) {
    const cve = entry.cve;
    const id = typeof cve?.id === "string" ? cve.id.toUpperCase() : "";
    if (!cve || !/^CVE-\d{4}-\d{4,7}$/.test(id)) continue;
    if (cve.vulnStatus === "Rejected") continue;
    const score = nvdScore(cve.metrics);
    if (score === null || score < minScore) continue;
    const description = cve.descriptions?.find((d) => d.lang === "en")?.value ?? cve.descriptions?.[0]?.value ?? "";
    // L'API NVD renvoie des dates sans fuseau, exprimées en UTC.
    const published = cve.published && !/[zZ]|[+-]\d\d:?\d\d$/.test(cve.published) ? `${cve.published}Z` : cve.published;
    out.push({
      uid: `nvd:${id}`,
      source: source.id,
      kind: "cve",
      lang: source.lang,
      title: id,
      url: `https://nvd.nist.gov/vuln/detail/${id}`,
      summary: toText(description, 700),
      publishedAt: parseDate(published, now),
      cvss: score,
      cves: [id],
      exploited: Boolean(cve.cisaExploitAdd),
    });
  }
  return out;
}
