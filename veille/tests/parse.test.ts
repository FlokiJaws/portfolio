import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeEntities, extractCves, nvdScore, parseFeed, parseKev, parseNvd, safeHttpUrl, toText } from "../lib/parse.ts";
import { classify, DEFAULT_SETTINGS, keywordRegex, normalizeSettings, shouldNotify } from "../lib/rules.ts";
import { SOURCE_BY_ID } from "../lib/sources.ts";

const now = new Date("2026-11-12T12:00:00Z");
const src = (id: string) => SOURCE_BY_ID.get(id)!;

test("toText retire le HTML, y compris encodé deux fois, sans laisser de balise", () => {
  assert.equal(toText("<p>Faille &amp; correctif&nbsp;<b>urgent</b></p>"), "Faille & correctif urgent");
  assert.equal(toText("&lt;p&gt;L&#8217;éditeur&lt;/p&gt;"), "L’éditeur");
  assert.equal(toText('<script>alert(1)</script>Texte<img src=x onerror="alert(1)">'), "Texte");
  assert.equal(toText("Résumé. The post Titre appeared first on Site."), "Résumé.");
  assert.ok(toText("mot ".repeat(400)).length <= 601);
});

test("decodeEntities ignore les points de code invalides", () => {
  assert.equal(decodeEntities("a&#0;b&#x110000;c&#65;"), "abcA");
  assert.equal(decodeEntities("&inconnu;"), "&inconnu;");
});

test("safeHttpUrl refuse tout sauf http(s)", () => {
  assert.equal(safeHttpUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpUrl("data:text/html,x"), null);
  assert.equal(safeHttpUrl(" https://example.com/a "), "https://example.com/a");
});

test("extractCves dédoublonne et normalise la casse", () => {
  assert.deepEqual(extractCves("cve-2026-1234 et CVE-2026-1234", "CVE-2025-99999"), ["CVE-2026-1234", "CVE-2025-99999"]);
});

test("parseFeed lit un flux RSS 2.0 (CDATA, content:encoded, guid à attribut)", () => {
  const xml = `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>x</title>
    <item><title><![CDATA[Zero-day exploité dans Ivanti &amp; co]]></title><link>https://example.com/a?x=1&amp;y=2</link>
      <guid isPermaLink="false">abc-1</guid><pubDate>Thu, 12 Nov 2026 08:00:00 +0000</pubDate>
      <description><![CDATA[<p>La faille CVE-2026-1111 est activement exploitée.</p>]]></description></item>
    <item><title>Sans lien</title></item>
    <item><title>Lien piégé</title><link>javascript:alert(1)</link></item>
    <item><title>Futur</title><link>https://example.com/b</link><pubDate>Thu, 12 Nov 2099 08:00:00 +0000</pubDate></item>
  </channel></rss>`;
  const items = parseFeed(xml, src("zataz"), now);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Zero-day exploité dans Ivanti & co");
  assert.equal(items[0].url, "https://example.com/a?x=1&y=2");
  assert.equal(items[0].uid, "zataz:abc-1");
  assert.equal(items[0].summary, "La faille CVE-2026-1111 est activement exploitée.");
  assert.deepEqual(items[0].cves, ["CVE-2026-1111"]);
  assert.equal(items[0].publishedAt.toISOString(), "2026-11-12T08:00:00.000Z");
  assert.equal(items[1].publishedAt.getTime(), now.getTime(), "une date future est ramenée à maintenant");
});

test("parseFeed lit un flux à un seul élément et un flux Atom", () => {
  const rss = `<rss><channel><item><title>Seul</title><link>https://example.com/1</link></item></channel></rss>`;
  assert.equal(parseFeed(rss, src("krebs"), now).length, 1);
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title type="html">Titre &lt;b&gt;Atom&lt;/b&gt;</title>
    <link rel="self" href="https://example.com/self"/><link rel="alternate" href="https://example.com/atom"/>
    <id>tag:1</id><updated>2026-11-11T10:00:00Z</updated><summary>Résumé</summary></entry></feed>`;
  const [entry] = parseFeed(atom, src("therecord"), now);
  assert.equal(entry.title, "Titre Atom");
  assert.equal(entry.url, "https://example.com/atom");
  assert.throws(() => parseFeed("<html><body>Erreur 503</body></html>", src("krebs"), now));
});

test("parseKev normalise le catalogue et ignore les entrées invalides", () => {
  const items = parseKev(
    { vulnerabilities: [
      { cveID: "CVE-2026-2222", vendorProject: "Fortinet", product: "FortiOS", vulnerabilityName: "Fortinet FortiOS Auth Bypass",
        dateAdded: "2026-11-10", shortDescription: "Contournement d'authentification.", dueDate: "2026-12-01", knownRansomwareCampaignUse: "Known" },
      { cveID: "pas-une-cve" },
    ] },
    src("cisa-kev"), now,
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].uid, "kev:CVE-2026-2222");
  assert.equal(items[0].exploited, true);
  assert.match(items[0].summary, /rançongiciels/);
  assert.equal(items[0].publishedAt.toISOString(), "2026-11-10T12:00:00.000Z");
  assert.throws(() => parseKev({}, src("cisa-kev"), now));
});

test("parseNvd ne garde que les scores au-dessus du seuil", () => {
  const cve = (id: string, metrics: object, extra: object = {}) => ({
    cve: { id, published: "2026-11-11T09:15:00.000", descriptions: [{ lang: "es", value: "es" }, { lang: "en", value: `Desc ${id}` }], metrics, ...extra },
  });
  const items = parseNvd(
    { vulnerabilities: [
      cve("CVE-2026-0001", { cvssMetricV31: [{ type: "Primary", cvssData: { baseScore: 9.8 } }] }),
      cve("CVE-2026-0002", { cvssMetricV31: [{ type: "Primary", cvssData: { baseScore: 7.5 } }] }),
      cve("CVE-2026-0003", {}),
      cve("CVE-2026-0004", { cvssMetricV40: [{ type: "Secondary", cvssData: { baseScore: 9.3 } }] }, { cisaExploitAdd: "2026-11-11" }),
      cve("CVE-2026-0005", { cvssMetricV31: [{ type: "Primary", cvssData: { baseScore: 10 } }] }, { vulnStatus: "Rejected" }),
    ] },
    src("nvd"), 9, now,
  );
  assert.deepEqual(items.map((i) => i.title), ["CVE-2026-0001", "CVE-2026-0004"]);
  assert.equal(items[0].summary, "Desc CVE-2026-0001");
  assert.equal(items[0].publishedAt.toISOString(), "2026-11-11T09:15:00.000Z");
  assert.equal(items[1].exploited, true);
  assert.equal(nvdScore({ cvssMetricV31: [{ type: "Secondary", cvssData: { baseScore: 5 } }, { type: "Primary", cvssData: { baseScore: 9.1 } }] }), 9.1);
});

test("classify et shouldNotify appliquent les règles", () => {
  const settings = normalizeSettings({ keywords: ["Fortinet", "AD"] });
  const base = { uid: "u", source: "bleepingcomputer", kind: "news" as const, lang: "en" as const, url: "https://e.com",
    publishedAt: now, cvss: null, cves: [], exploited: false, summary: "" };
  assert.deepEqual(classify({ ...base, title: "Chrome zero-day exploited in the wild" }, settings), ["hot"]);
  assert.deepEqual(classify({ ...base, title: "New Fortinet patch released" }, settings), ["kw:Fortinet"]);
  assert.deepEqual(classify({ ...base, title: "How to upload files safely" }, settings), [], "« AD » ne correspond pas à « upload »");
  assert.deepEqual(classify({ ...base, title: "Attaque sur AD." }, settings), ["kw:AD"]);
  assert.deepEqual(classify({ ...base, source: "certfr-alerte", kind: "alert", title: "Vulnérabilité dans X" }, settings), ["certfr-alert"]);
  assert.deepEqual(classify({ ...base, source: "nvd", kind: "cve", title: "CVE-1", cvss: 9.8, exploited: true }, settings), ["kev", "cvss"]);
  assert.deepEqual(classify({ ...base, title: "Quarterly earnings report" }, settings), []);

  assert.equal(shouldNotify(["hot"], DEFAULT_SETTINGS), true);
  assert.equal(shouldNotify(["hot"], normalizeSettings({ notify: { hotNews: false } })), false);
  assert.equal(shouldNotify(["kw:x", "cvss"], normalizeSettings({ notify: { keywords: false, criticalCve: false } })), false);
  assert.equal(shouldNotify([], DEFAULT_SETTINGS), false);
  assert.ok(keywordRegex("C++ (lib)").test("bug dans C++ (lib) hier"), "les caractères spéciaux sont échappés");
});

test("normalizeSettings assainit une entrée arbitraire", () => {
  const s = normalizeSettings({ notify: { kev: "oui", hotNews: false }, keywords: ["  Cisco  ", "cisco", "x", 42, "a".repeat(200)], disabledSources: "nvd" });
  assert.equal(s.notify.kev, true);
  assert.equal(s.notify.hotNews, false);
  assert.deepEqual(s.keywords, ["Cisco", "a".repeat(60)]);
  assert.deepEqual(s.disabledSources, []);
  assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
});
