"use client";

import { useEffect, useRef, useState } from "react";
import { fullDate, sourceName, tagsFor, type Item } from "@/lib/client";
import { ExternalIcon, ShareIcon, StarIcon } from "./icons";

type Props = {
  item: Item;
  onClose: () => void;
  onPatch: (id: number, patch: { read?: boolean; starred?: boolean }) => void;
  onToast: (message: string) => void;
};

export default function ItemSheet({ item, onClose, onPatch, onToast }: Props) {
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    // Empêche le fil de défiler derrière la fiche.
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: item.title, url: item.url });
      else {
        await navigator.clipboard.writeText(item.url);
        onToast("Lien copié");
      }
    } catch {
      /* partage annulé */
    }
  }

  // Les CVE ont leur propre liste cliquable plus bas : pas de doublon dans les étiquettes.
  const tags = tagsFor(item).filter((t) => !t.mono);
  const isAlert = item.reasons.includes("certfr-alert");

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : { transition: "transform 0.2s" }}
      >
        <div
          className="grabber"
          onTouchStart={(e) => (startY.current = e.touches[0].clientY)}
          onTouchMove={(e) => startY.current !== null && setDrag(Math.max(0, e.touches[0].clientY - startY.current))}
          onTouchEnd={() => {
            if (drag > 90) onClose();
            setDrag(0);
            startY.current = null;
          }}
        >
          <i />
        </div>
        <div className="sheet-body">
          <div className="eyebrow mono">
            <span>{sourceName(item.source)}</span>
            <span>·</span>
            <time dateTime={item.publishedAt}>{fullDate(item.publishedAt)}</time>
          </div>
          <h2 className={`sheet-title${item.kind === "cve" ? " mono" : ""}`}>{item.title}</h2>
          {tags.length > 0 && (
            <div className="tags">
              {tags.map((t) => (
                <span key={t.label} className={`tag ${t.tone}${t.mono ? " mono" : ""}`}>{t.label}</span>
              ))}
            </div>
          )}
          {(item.exploited || item.kind === "kev") && (
            <p className="sheet-note kev">Exploitation active confirmée (catalogue CISA KEV). À corriger en priorité.</p>
          )}
          {isAlert && <p className="sheet-note crit">Alerte CERT-FR : menace majeure, action immédiate recommandée.</p>}
          {item.summary && <p className="sheet-text" lang={item.lang}>{item.summary}</p>}
          {item.cves.length > 0 && item.kind !== "cve" && (
            <div className="cve-list">
              {item.cves.slice(0, 12).map((cve) => (
                <a key={cve} className="cve-link mono" href={`https://nvd.nist.gov/vuln/detail/${cve}`} target="_blank" rel="noopener noreferrer">
                  {cve}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="sheet-actions">
          <button
            className={`btn square${item.starred ? " is-on" : ""}`}
            aria-label={item.starred ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={item.starred}
            onClick={() => onPatch(item.id, { starred: !item.starred })}
          >
            <StarIcon size={21} filled={item.starred} />
          </button>
          <button className="btn square" aria-label="Partager" onClick={share}>
            <ShareIcon />
          </button>
          <a className="btn primary" href={item.url} target="_blank" rel="noopener noreferrer">
            Lire la source <ExternalIcon />
          </a>
        </div>
      </section>
    </>
  );
}
