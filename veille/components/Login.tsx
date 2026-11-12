"use client";

import { useState } from "react";

export default function Login({ dbError }: { dbError: boolean }) {
  const [error, setError] = useState(dbError ? "Base de données injoignable. Réessaie dans un instant." : "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Lu dans le formulaire, pas dans l'état React : le remplissage automatique d'iOS peut précéder l'hydratation.
    const password = String(new FormData(e.currentTarget as HTMLFormElement).get("password") ?? "");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Connexion impossible.");
    } catch {
      setError("Pas de connexion au serveur.");
    }
    setBusy(false);
  }

  return (
    <main className="login">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" />
      <h1>Veille Cyber</h1>
      <p>Alertes, failles critiques et actualité sécurité, au même endroit.</p>
      <form onSubmit={submit}>
        <input
          className="field"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Mot de passe"
          aria-label="Mot de passe"
          required
        />
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"}
        </button>
        <div className="error" role="alert">{error}</div>
      </form>
    </main>
  );
}
