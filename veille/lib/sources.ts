export type Kind = "alert" | "advisory" | "cve" | "kev" | "news";
export type Lang = "fr" | "en";

export type Source = {
  id: string;
  name: string;
  lang: Lang;
  kind: Kind;
  type: "rss" | "kev" | "nvd";
  url: string;
};

export const SOURCES: Source[] = [
  // --- Officiel FR ---
  { id: "certfr-alerte", name: "CERT-FR · Alertes", lang: "fr", kind: "alert", type: "rss", url: "https://www.cert.ssi.gouv.fr/alerte/feed/" },
  { id: "certfr-avis", name: "CERT-FR · Avis", lang: "fr", kind: "advisory", type: "rss", url: "https://www.cert.ssi.gouv.fr/avis/feed/" },
  { id: "certfr-cti", name: "CERT-FR · Menaces", lang: "fr", kind: "news", type: "rss", url: "https://www.cert.ssi.gouv.fr/cti/feed/" },
  // --- Officiel US / vulnérabilités ---
  { id: "cisa-kev", name: "CISA KEV", lang: "en", kind: "kev", type: "kev", url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json" },
  { id: "nvd", name: "NVD", lang: "en", kind: "cve", type: "nvd", url: "https://services.nvd.nist.gov/rest/json/cves/2.0" },
  { id: "cisa-advisories", name: "CISA · Advisories", lang: "en", kind: "advisory", type: "rss", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml" },
  // --- Actu FR ---
  { id: "zataz", name: "ZATAZ", lang: "fr", kind: "news", type: "rss", url: "https://www.zataz.com/feed/" },
  { id: "lmi", name: "Le Monde Informatique", lang: "fr", kind: "news", type: "rss", url: "https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml" },
  { id: "numerama", name: "Numerama · Cyberguerre", lang: "fr", kind: "news", type: "rss", url: "https://www.numerama.com/cyberguerre/feed/" },
  { id: "undernews", name: "UnderNews", lang: "fr", kind: "news", type: "rss", url: "https://www.undernews.fr/feed" },
  // --- Actu EN ---
  { id: "bleepingcomputer", name: "BleepingComputer", lang: "en", kind: "news", type: "rss", url: "https://www.bleepingcomputer.com/feed/" },
  { id: "thehackernews", name: "The Hacker News", lang: "en", kind: "news", type: "rss", url: "https://feeds.feedburner.com/TheHackersNews" },
  { id: "therecord", name: "The Record", lang: "en", kind: "news", type: "rss", url: "https://therecord.media/feed" },
  { id: "krebs", name: "Krebs on Security", lang: "en", kind: "news", type: "rss", url: "https://krebsonsecurity.com/feed/" },
  { id: "securityweek", name: "SecurityWeek", lang: "en", kind: "news", type: "rss", url: "https://www.securityweek.com/feed/" },
  { id: "darkreading", name: "Dark Reading", lang: "en", kind: "news", type: "rss", url: "https://www.darkreading.com/rss.xml" },
];

export const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));
