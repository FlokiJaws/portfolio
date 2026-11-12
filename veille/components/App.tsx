"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ago, api, sourceName, tagsFor, type AppState, type Counts, type Item, type Settings } from "@/lib/client";
import ItemSheet from "./ItemSheet";
import SettingsView from "./SettingsView";
import { AlertIcon, CheckAllIcon, CloseIcon, FeedIcon, GearIcon, RefreshIcon, SearchIcon, StarIcon } from "./icons";

type Tab = "all" | "critical" | "starred" | "settings";
type Filters = { type: "all" | "vulns" | "news"; lang: "all" | "fr" | "en"; unread: boolean };
type Page = { items: Item[]; nextCursor: string | null; counts: Counts };

const TITLES: Record<Tab, string> = { all: "Veille", critical: "Critique", starred: "Favoris", settings: "Réglages" };

function Row({ item, onOpen }: { item: Item; onOpen: (item: Item) => void }) {
  const tags = tagsFor(item);
  const kev = item.exploited || item.kind === "kev";
  const classes = ["row", item.read && "is-read", item.critical && "is-critical", kev && "is-kev"].filter(Boolean).join(" ");
  return (
    <button className={classes} onClick={() => onOpen(item)}>
      <div className="eyebrow mono">
        <span>{sourceName(item.source)}</span>
        <span aria-hidden>·</span>
        <time dateTime={item.publishedAt}>{ago(item.publishedAt)}</time>
        {item.starred && <span className="star" aria-label="Favori"><StarIcon size={12} filled /></span>}
        {!item.read && <span className="dot" aria-label="Non lu" />}
      </div>
      <div className={`row-title${item.kind === "cve" ? " is-id" : ""}`}>{item.title}</div>
      {item.summary && <div className="row-summary" lang={item.lang}>{item.summary}</div>}
      {tags.length > 0 && (
        <div className="tags">
          {tags.map((t) => (
            <span key={t.label} className={`tag ${t.tone}${t.mono ? " mono" : ""}`}>{t.label}</span>
          ))}
        </div>
      )}
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("all");
  const [filters, setFilters] = useState<Filters>({ type: "all", lang: "all", unread: false });
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState<Counts | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState("");

  const requestId = useRef(0);
  const loadedAt = useRef(0);
  const loadingMore = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? "" : current)), 2600);
  }, []);

  const params = useCallback(
    (cursor?: string) => {
      const p = new URLSearchParams({ tab: tab === "settings" ? "all" : tab, type: filters.type, lang: filters.lang });
      if (filters.unread) p.set("unread", "1");
      if (query) p.set("q", query);
      if (cursor) p.set("cursor", cursor);
      return p.toString();
    },
    [tab, filters, query],
  );

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const page = await api<Page>(`/api/items?${params()}`);
      if (id !== requestId.current) return;
      setItems(page.items);
      setNextCursor(page.nextCursor);
      setCounts(page.counts);
      setError("");
      loadedAt.current = Date.now();
    } catch (err) {
      if (id === requestId.current) setError((err as Error).message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [params]);

  const loadState = useCallback(async () => {
    try {
      const state = await api<AppState>("/api/state");
      setAppState(state);
      setCounts(state.counts);
    } catch {
      /* l'en-tête affichera simplement moins d'informations */
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore.current) return;
    loadingMore.current = true;
    const id = requestId.current;
    try {
      const page = await api<Page>(`/api/items?${params(nextCursor)}`);
      if (id !== requestId.current) return;
      setItems((current) => [...current, ...page.items.filter((i) => !current.some((c) => c.id === i.id))]);
      setNextCursor(page.nextCursor);
    } catch {
      /* nouvel essai au prochain défilement */
    } finally {
      loadingMore.current = false;
    }
  }, [nextCursor, params]);

  // Recharge le fil quand l'onglet, les filtres ou la recherche changent.
  useEffect(() => {
    if (tab === "settings") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement réseau : l'état n'est mis à jour qu'après la réponse
    load();
  }, [tab, load]);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const openItem = useCallback((item: Item) => {
    setSelected(item);
    // Une entrée d'historique par fiche : le geste « retour » d'iOS ferme la fiche au lieu de quitter l'app.
    window.history.pushState({ sheet: item.id }, "");
    if (!item.read) {
      setItems((current) => current.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      setCounts((c) => c && { ...c, unread: Math.max(0, c.unread - 1), criticalUnread: Math.max(0, c.criticalUnread - (item.critical ? 1 : 0)) });
      api(`/api/items/${item.id}`, { method: "PATCH", body: { read: true } }).catch(() => {});
    }
  }, []);

  const closeItem = useCallback(() => {
    if (window.history.state?.sheet) window.history.back();
    else setSelected(null);
  }, []);

  const openFromUrl = useCallback(
    async (url: string) => {
      const p = new URL(url, window.location.origin).searchParams;
      const wanted = p.get("tab");
      if (wanted === "critical" || wanted === "starred" || wanted === "all") {
        if (window.history.state?.sheet) window.history.back();
        setLoading(true);
        setTab(wanted);
      }
      const id = p.get("item");
      if (id && /^\d+$/.test(id)) {
        try {
          const { item } = await api<{ item: Item }>(`/api/items/${id}`);
          if (window.history.state?.sheet) window.history.replaceState(null, "");
          openItem(item);
        } catch {
          showToast("Cet élément n’est plus disponible");
        }
      }
    },
    [openItem, showToast],
  );

  // Démarrage : état global, service worker, lien profond venant d'une notification.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement réseau : l'état n'est mis à jour qu'après la réponse
    loadState();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      const onMessage = (e: MessageEvent) => e.data?.type === "open" && typeof e.data.url === "string" && openFromUrl(e.data.url);
      navigator.serviceWorker.addEventListener("message", onMessage);
      return () => navigator.serviceWorker.removeEventListener("message", onMessage);
    }
  }, [loadState, openFromUrl]);

  useEffect(() => {
    if (window.location.search) {
      const url = window.location.href;
      window.history.replaceState(null, "", "/");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement réseau : l'état n'est mis à jour qu'après la réponse
      openFromUrl(url);
    }
    const onPop = () => setSelected(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retour au premier plan : on rafraîchit si l'app est restée en veille plus d'une minute.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - loadedAt.current < 60_000) return;
      loadState();
      if (tab !== "settings" && window.scrollY < 300) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [tab, load, loadState]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { rootMargin: "600px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  // Pastille sur l'icône de l'app : nombre d'éléments critiques non lus.
  useEffect(() => {
    if (!counts || !("setAppBadge" in navigator)) return;
    const nav = navigator as Navigator & { setAppBadge: (n: number) => Promise<void>; clearAppBadge: () => Promise<void> };
    (counts.criticalUnread > 0 ? nav.setAppBadge(counts.criticalUnread) : nav.clearAppBadge()).catch(() => {});
  }, [counts]);

  function switchTab(next: Tab) {
    if (next === tab) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (next !== "settings") {
      setLoading(true);
      setItems([]);
    } else loadState();
    setTab(next);
    window.scrollTo(0, 0);
  }

  function setFilter(patch: Partial<Filters>) {
    setLoading(true);
    setFilters((f) => ({ ...f, ...patch }));
    window.scrollTo(0, 0);
  }

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const result = await api<{ done: boolean; summary: { added: number } | null }>("/api/refresh", { method: "POST" });
      await Promise.all([load(), loadState()]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (!result.done) showToast("Collecte en cours, le fil se complétera");
      else showToast(result.summary?.added ? `${result.summary.added} nouveaux éléments` : "Déjà à jour");
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  async function markAllRead() {
    try {
      const result = await api<{ updated: number; counts: Counts }>(`/api/items/read-all?${params()}`, { method: "POST" });
      setItems((current) => (filters.unread ? [] : current.map((i) => ({ ...i, read: true }))));
      setCounts(result.counts);
      showToast(result.updated ? `${result.updated} marqués comme lus` : "Tout est déjà lu");
    } catch (err) {
      showToast((err as Error).message);
    }
  }

  function patchItem(id: number, patch: { read?: boolean; starred?: boolean }) {
    const apply = (i: Item) => (i.id === id ? { ...i, ...patch } : i);
    setItems((current) => current.map(apply).filter((i) => tab !== "starred" || i.starred || i.id === selected?.id));
    setSelected((current) => current && apply(current));
    api(`/api/items/${id}`, { method: "PATCH", body: patch }).catch(() => showToast("Modification non enregistrée"));
  }

  async function saveSettings(settings: Settings) {
    setAppState((s) => s && { ...s, settings });
    try {
      await api("/api/settings", { method: "PUT", body: settings });
    } catch {
      showToast("Réglage non enregistré");
      loadState();
    }
  }

  const failing = appState?.lastRun?.errors.length ?? 0;
  const active = appState ? appState.sources.length - appState.settings.disabledSources.length : 0;
  const statusText = !appState
    ? "Connexion…"
    : !appState.lastRun
      ? "Première collecte en cours…"
      : `${active - failing}/${active} sources · maj ${ago(appState.lastRun.startedAt)}`;

  return (
    <div className="shell">
      <header className="header">
        <div className="header-row">
          <div>
            <h1 className="title">{TITLES[tab]}</h1>
            <div className="status mono">
              <span className={`pulse${refreshing ? " busy" : failing ? " warn" : ""}`} />
              <span>{statusText}</span>
            </div>
          </div>
          {tab !== "settings" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="icon-btn" onClick={markAllRead} aria-label="Tout marquer comme lu"><CheckAllIcon /></button>
              <button className="icon-btn" onClick={refresh} disabled={refreshing} aria-label="Actualiser">
                <RefreshIcon className={refreshing ? "spin" : undefined} />
              </button>
            </div>
          )}
        </div>
        {tab !== "settings" ? (
          <>
            <label className="search">
              <SearchIcon />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit, une CVE…"
                aria-label="Rechercher"
                autoCapitalize="none"
                autoCorrect="off"
                enterKeyHint="search"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Effacer la recherche" style={{ padding: 6 }}><CloseIcon /></button>
              )}
            </label>
            <div className="chips">
              <button className="chip" aria-pressed={filters.unread} onClick={() => setFilter({ unread: !filters.unread })}>
                Non lus{counts && counts.unread > 0 ? ` · ${counts.unread > 999 ? "999+" : counts.unread}` : ""}
              </button>
              <span className="chip-sep" />
              <button className="chip" aria-pressed={filters.type === "vulns"} onClick={() => setFilter({ type: filters.type === "vulns" ? "all" : "vulns" })}>Vulnérabilités</button>
              <button className="chip" aria-pressed={filters.type === "news"} onClick={() => setFilter({ type: filters.type === "news" ? "all" : "news" })}>Actualité</button>
              <span className="chip-sep" />
              <button className="chip" aria-pressed={filters.lang === "fr"} onClick={() => setFilter({ lang: filters.lang === "fr" ? "all" : "fr" })}>FR</button>
              <button className="chip" aria-pressed={filters.lang === "en"} onClick={() => setFilter({ lang: filters.lang === "en" ? "all" : "en" })}>EN</button>
            </div>
          </>
        ) : (
          <div style={{ height: 14 }} />
        )}
      </header>

      {tab === "settings" ? (
        appState ? (
          <SettingsView state={appState} onSettings={saveSettings} onReload={loadState} onToast={showToast} />
        ) : (
          <div className="empty"><p>Chargement…</p></div>
        )
      ) : (
        <main className="feed">
          {loading && items.length === 0 ? (
            Array.from({ length: 7 }, (_, i) => (
              <div className="skeleton" key={i}><i style={{ width: "32%" }} /><i style={{ width: "92%", height: 14 }} /><i style={{ width: "70%" }} /></div>
            ))
          ) : error && items.length === 0 ? (
            <div className="empty">
              <h2>Impossible de charger le fil</h2>
              <p>{error}</p>
              <button className="btn" style={{ marginTop: 18 }} onClick={() => { setLoading(true); load(); }}>Réessayer</button>
            </div>
          ) : items.length === 0 ? (
            <div className="empty">
              {query || filters.unread || filters.type !== "all" || filters.lang !== "all" ? (
                <><h2>Aucun résultat</h2><p>Essaie d’élargir la recherche ou de retirer un filtre.</p></>
              ) : tab === "starred" ? (
                <><h2>Aucun favori</h2><p>Touche l’étoile dans une fiche pour la retrouver ici.</p></>
              ) : tab === "critical" ? (
                <><h2>Rien de critique</h2><p>Les failles exploitées, alertes CERT-FR et CVE critiques apparaîtront ici.</p></>
              ) : (
                <><h2>Le fil se remplit</h2><p>La première collecte prend moins d’une minute. Touche Actualiser pour vérifier.</p></>
              )}
            </div>
          ) : (
            items.map((item) => <Row key={item.id} item={item} onOpen={openItem} />)
          )}
          <div ref={sentinel} className="sentinel mono">{nextCursor ? "Chargement…" : items.length > 12 ? "— fin du fil —" : ""}</div>
        </main>
      )}

      <nav className="tabbar" aria-label="Navigation">
        <div className="tabbar-inner">
          <button className="tab" aria-current={tab === "all" ? "page" : undefined} onClick={() => switchTab("all")}><FeedIcon />Fil</button>
          <button className="tab" aria-current={tab === "critical" ? "page" : undefined} onClick={() => switchTab("critical")}>
            <AlertIcon />Critique
            {counts && counts.criticalUnread > 0 && <span className="badge">{counts.criticalUnread > 99 ? "99+" : counts.criticalUnread}</span>}
          </button>
          <button className="tab" aria-current={tab === "starred" ? "page" : undefined} onClick={() => switchTab("starred")}><StarIcon filled={tab === "starred"} />Favoris</button>
          <button className="tab" aria-current={tab === "settings" ? "page" : undefined} onClick={() => switchTab("settings")}><GearIcon />Réglages</button>
        </div>
      </nav>

      {selected && <ItemSheet item={selected} onClose={closeItem} onPatch={patchItem} onToast={showToast} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
