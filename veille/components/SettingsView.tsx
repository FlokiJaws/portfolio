"use client";

import { useEffect, useState } from "react";
import { ago, api, urlBase64ToBytes, type AppState, type Settings } from "@/lib/client";
import { CloseIcon } from "./icons";

type PushStatus = "loading" | "needs-install" | "unsupported" | "denied" | "off" | "on";

type Props = {
  state: AppState;
  onSettings: (settings: Settings) => void;
  onReload: () => void;
  onToast: (message: string) => void;
};

const RULES: { key: keyof Settings["notify"]; title: string; sub: string }[] = [
  { key: "kev", title: "Failles exploitées activement", sub: "Nouvelle entrée au catalogue CISA KEV" },
  { key: "certfrAlert", title: "Alertes CERT-FR", sub: "Menaces majeures signalées par l’ANSSI" },
  { key: "criticalCve", title: "CVE critiques", sub: "Score CVSS de 9,0 ou plus" },
  { key: "hotNews", title: "Zero-day dans l’actu", sub: "Articles signalant une exploitation en cours" },
  { key: "keywords", title: "Mes mots-clés", sub: "Tout élément qui cite un mot-clé suivi" },
];

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />;
}

async function detectPush(): Promise<PushStatus> {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    return ios && !standalone ? "needs-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription && Notification.permission === "granted" ? "on" : "off";
}

export default function SettingsView({ state, onSettings, onReload, onToast }: Props) {
  const { settings } = state;
  const [push, setPush] = useState<PushStatus>("loading");
  const [busy, setBusy] = useState(false);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    detectPush().then(setPush, () => setPush("unsupported"));
  }, []);

  const update = (patch: Partial<Settings>) => onSettings({ ...settings, ...patch });

  async function enablePush() {
    setBusy(true);
    try {
      // La demande de permission doit partir directement du toucher (exigence iOS).
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const key = urlBase64ToBytes(state.push.publicKey);
      let subscription: PushSubscription;
      try {
        subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      } catch {
        // Un ancien abonnement lié à une autre clé serveur bloque le nouveau : on le remplace.
        await (await registration.pushManager.getSubscription())?.unsubscribe();
        subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      }
      await api("/api/push", { method: "POST", body: subscription.toJSON() });
      setPush("on");
      onToast("Notifications activées");
      onReload();
    } catch (err) {
      onToast((err as Error).message || "Activation impossible");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await api("/api/push", { method: "DELETE", body: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }
      setPush("off");
      onReload();
    } catch (err) {
      onToast((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function testPush() {
    setBusy(true);
    try {
      await api("/api/push/test", { method: "POST" });
      onToast("Notification de test envoyée");
    } catch {
      onToast("Envoi impossible : réactive les notifications");
    } finally {
      setBusy(false);
    }
  }

  function addKeyword(e: React.FormEvent) {
    e.preventDefault();
    const value = keyword.trim();
    if (value.length < 2) return;
    if (!settings.keywords.some((k) => k.toLowerCase() === value.toLowerCase())) update({ keywords: [...settings.keywords, value] });
    setKeyword("");
  }

  function toggleSource(id: string, enabled: boolean) {
    const disabled = new Set(settings.disabledSources);
    if (enabled) disabled.delete(id);
    else disabled.add(id);
    update({ disabledSources: [...disabled] });
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="settings">
      <h2 className="section-label">Notifications</h2>
      {push === "needs-install" && (
        <div className="card">
          <h3>Installe l’app pour recevoir les alertes</h3>
          <p>Sur iPhone, les notifications ne fonctionnent que depuis l’écran d’accueil.</p>
          <ol className="steps">
            <li><b>1</b><span>Dans Safari, touche le bouton Partager</span></li>
            <li><b>2</b><span>Choisis « Sur l’écran d’accueil »</span></li>
            <li><b>3</b><span>Ouvre Veille depuis l’icône, puis reviens ici</span></li>
          </ol>
        </div>
      )}
      {push === "unsupported" && (
        <div className="card">
          <h3>Notifications indisponibles</h3>
          <p>Ce navigateur ne prend pas en charge les notifications push (iOS 16.4 minimum sur iPhone).</p>
        </div>
      )}
      {push === "denied" && (
        <div className="card">
          <h3>Notifications bloquées</h3>
          <p>Autorise-les dans Réglages › Notifications › Veille, puis rouvre l’app.</p>
        </div>
      )}
      {push === "off" && (
        <div className="card">
          <h3>Reçois les alertes critiques</h3>
          <p>Une notification seulement quand ça compte : faille exploitée, alerte CERT-FR, CVE critique.</p>
          <button className="btn primary block" onClick={enablePush} disabled={busy}>Activer les notifications</button>
        </div>
      )}
      {push === "on" && (
        <div className="group">
          <div className="cell">
            <span className="state-dot ok" />
            <div className="cell-main">
              <div className="cell-title">Activées sur cet appareil</div>
              <div className="cell-sub">{state.push.devices} appareil{state.push.devices > 1 ? "s" : ""} abonné{state.push.devices > 1 ? "s" : ""}</div>
            </div>
          </div>
          <button className="cell" onClick={testPush} disabled={busy} style={{ width: "100%", textAlign: "left" }}>
            <div className="cell-main"><div className="cell-title" style={{ color: "var(--accent)" }}>Envoyer une notification de test</div></div>
          </button>
          <button className="cell" onClick={disablePush} disabled={busy} style={{ width: "100%", textAlign: "left" }}>
            <div className="cell-main"><div className="cell-title" style={{ color: "var(--crit)" }}>Désactiver sur cet appareil</div></div>
          </button>
        </div>
      )}

      <h2 className="section-label">Me prévenir pour</h2>
      <div className="group">
        {RULES.map((rule) => (
          <div className="cell" key={rule.key}>
            <div className="cell-main">
              <div className="cell-title">{rule.title}</div>
              <div className="cell-sub">{rule.sub}</div>
            </div>
            <Switch
              label={rule.title}
              checked={settings.notify[rule.key]}
              onChange={(v) => update({ notify: { ...settings.notify, [rule.key]: v } })}
            />
          </div>
        ))}
      </div>
      <p className="hint">Au-delà de 3 alertes en même temps, elles sont regroupées en une seule notification.</p>

      <h2 className="section-label">Mots-clés suivis</h2>
      <div className="group">
        <form className="kw-form" onSubmit={addKeyword}>
          <input
            className="field"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Fortinet, Active Directory…"
            aria-label="Nouveau mot-clé"
            maxLength={60}
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="done"
          />
          <button className="btn" type="submit" disabled={keyword.trim().length < 2} style={{ height: 44 }}>Ajouter</button>
        </form>
        {settings.keywords.length > 0 && (
          <div className="kw-list">
            {settings.keywords.map((k) => (
              <span className="kw" key={k}>
                {k}
                <button aria-label={`Retirer ${k}`} onClick={() => update({ keywords: settings.keywords.filter((x) => x !== k) })}>
                  <CloseIcon size={13} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="hint">Un élément qui cite un de ces mots passe dans l’onglet Critique. S’applique aux nouveaux éléments.</p>

      {(["fr", "en"] as const).map((lang) => (
        <div key={lang}>
          <h2 className="section-label">Sources {lang === "fr" ? "francophones" : "anglophones"}</h2>
          <div className="group">
            {state.sources.filter((s) => s.lang === lang).map((s) => {
              const enabled = !settings.disabledSources.includes(s.id);
              const st = s.state;
              return (
                <div className="cell" key={s.id}>
                  <span className={`state-dot${!enabled || !st ? "" : st.ok ? " ok" : " err"}`} />
                  <div className="cell-main">
                    <div className="cell-title">{s.name}</div>
                    <div className={`cell-sub${enabled && st && !st.ok ? " err" : ""}`}>
                      {!enabled ? "Désactivée" : !st ? "En attente de la première collecte" : st.ok ? `À jour · ${ago(st.lastRun)}` : `Erreur : ${st.error}`}
                    </div>
                  </div>
                  <Switch label={s.name} checked={enabled} onChange={(v) => toggleSource(s.id, v)} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <h2 className="section-label">Compte</h2>
      <div className="group">
        <div className="cell">
          <div className="cell-main">
            <div className="cell-title">{state.counts.total} éléments en base</div>
            <div className="cell-sub">
              {state.lastRun ? `Dernière collecte ${ago(state.lastRun.startedAt)} · conservés 90 jours` : "Première collecte en cours"}
            </div>
          </div>
        </div>
        <button className="cell" onClick={logout} style={{ width: "100%", textAlign: "left" }}>
          <div className="cell-main"><div className="cell-title" style={{ color: "var(--crit)" }}>Se déconnecter</div></div>
        </button>
      </div>
    </div>
  );
}
