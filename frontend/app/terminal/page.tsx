"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { profile } from '@/data/profile';
import type { Project } from '@/data/projects';
import { getProjects } from '@/lib/cms';
import { PageShell } from '@/components/PageShell';
import { languages, tools, formatSkills } from '@/data/skills';

type HistoryLine = { type: 'cmd' | 'out'; text: string; path?: string };

type FocusedProject = {
  title: string;
  description: string;
  highlights?: string[];
  note?: string;
  image?: string;
  liveUrl?: string;
  repoUrl?: string;
  repoPrivate?: boolean;
};

type FocusedContact = {
  sumup: string;
  email: string;
  linkedin: string;
  github: string;
  cvUrl: string;
  links: { label: string; url: string }[];
};

const contactData: FocusedContact = {
  sumup: profile.tagline,
  email: profile.email,
  linkedin: profile.linkedin,
  github: profile.github,
  cvUrl: profile.cvUrl,
  links: profile.links,
};

const SL_TRAIN =
  "      .--.\n" +
  "   .-(    ).\n" +
  "  (___.__)__)\n" +
  " ___|=|__|=|______\n" +
  "|   TOOT TOOT !   |__\n" +
  "|__________________|\n" +
  " (o)(o)------(o)(o)\n" +
  "\n" +
  "(tu voulais dire 'ls' ?)";

const MATRIX_CHARS = "01アイウエオカキクケコサシスセソタチツテト";

type MatrixColumn = { text: string; duration: number; delay: number };

function buildMatrixColumns(count: number, height: number): MatrixColumn[] {
  return Array.from({ length: count }, () => ({
    text: Array.from({ length: height }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]).join("\n"),
    duration: 1.2 + Math.random(),
    delay: Math.random() * 0.6,
  }));
}

/** Réponses "easter egg" pour les commandes suspectes (scan, injection, destruction...). */
function getEasterEgg(fullCmd: string, command: string): string | null {
  const lower = fullCmd.toLowerCase();

  if (/:\(\)\s*\{\s*:\|:&\s*\}\s*;\s*:/.test(fullCmd)) {
    return "Fork bomb détectée. Gg, mais c'est du React côté client : au pire ça crashe ton onglet, pas le serveur ;)";
  }
  if (lower.includes("1=1") || lower.includes("drop table") || lower.includes("union select") || lower.includes("' or '")) {
    return "Belle tentative d'injection SQL. Pas de base de données ici, mais j'apprécie le geste 😏";
  }
  if (lower.includes("<script")) {
    return "XSS ? Rien n'est rendu en HTML ici, gg quand même.";
  }
  if (command === "sudo") {
    return "Nice try. 'sudo' ne marche pas plus ici que dans la vraie vie sans mot de passe.";
  }
  if (command === "su") {
    return "Permission denied : tu n'es ni dans /etc/sudoers, ni dans ma vie privée.";
  }
  if (command === "rm") {
    return "Permission denied. (Rassure-toi, même si ça marchait, j'ai des backups)";
  }
  if (["nmap", "ping", "nc", "netcat", "wget", "curl"].includes(command)) {
    return "Scan refusé : il n'y a rien à scanner, ce \"serveur\" est du JS dans ton navigateur.";
  }
  if (command === "ssh") {
    return "Connection refused : tu n'es pas dans authorized_keys.";
  }
  if (command === "sl") {
    return SL_TRAIN;
  }
  return null;
}

export default function TerminalPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  const [history, setHistory] = useState<HistoryLine[]>([
    { type: 'out', text: "Tapez 'help' pour voir les commandes." }
  ]);
  const [input, setInput] = useState("");
  const [currentPath, setCurrentPath] = useState("~");

  const [focusedProject, setFocusedProject] = useState<FocusedProject | null>(null);
  const [focusedContact, setFocusedContact] = useState<FocusedContact | null>(null);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [matrixRain, setMatrixRain] = useState(false);
  const [matrixColumns, setMatrixColumns] = useState<MatrixColumn[]>([]);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const fileSystem = useMemo<Record<string, { type: 'dir'; children: string[] }>>(() => ({
    "~": { type: "dir", children: ["projects", "skills", "bio.txt", "experience.txt", "contact"] },
    "~/projects": { type: "dir", children: projects.map((p) => p.slug) },
    "~/skills": { type: "dir", children: ["languages.txt", "tools.txt"] },
  }), [projects]);

  const fileContent = useMemo<Record<string, string | FocusedProject>>(() => {
    const content: Record<string, string | FocusedProject> = {
      "bio.txt": profile.bio,
      "flag.txt":
        "CTF{tu_cherches_trop_loin_mais_jadore_ca}\n" +
        "Bien joué, mais ce n'est pas vraiment un CTF ici. Si t'es arrivé jusque là,\n" +
        "contacte-moi (commande `contact`) -- on en discute autour d'un café.",
      "/etc/passwd": "cat: /etc/passwd: Permission denied (et sinon y'a que du café dedans ☕)",
      "/etc/shadow": "cat: /etc/shadow: Permission denied (et sinon y'a que du café dedans ☕)",
      "experience.txt":
        "Stagiaire developpeur full-stack -- GAMER CLASH SARL (Gamecash), Limoges\n" +
        "  03/2025 - 05/2025 (8 semaines)\n" +
        "  Conception et mise en production en autonomie d'une plateforme e-commerce\n" +
        "  (React, Firebase, Node.js, Vercel), de l'analyse des besoins au deploiement.\n" +
        "\n" +
        "Employe polyvalent -- Gamecash, Limoges (CDI etudiant)\n" +
        "  09/2025 - 06/2026\n" +
        "  Conseil client, rachat de produits d'occasion, diagnostic et remise en etat.\n" +
        "\n" +
        "Employe drive et rayon fruits & legumes -- Super U (CDI etudiant)\n" +
        "  depuis 06/2026\n" +
        "  Rayon gere seul le week-end : mise en rayon, fraicheur, tenue du rayon.\n" +
        "\n" +
        "Intervenant -- Lycee Saint-Jean (projet de M1)\n" +
        "  2025-2026\n" +
        "  Introduction au Big Data, a l'IA et a la cybersecurite aupres de classes de SNT.",
      "languages.txt": formatSkills(languages),
      "tools.txt": formatSkills(tools),
    };
    projects.forEach((p) => {
      content[p.slug] = {
        title: p.title,
        description: p.details ?? p.description,
        highlights: p.highlights,
        note: p.note,
        image: p.image,
        liveUrl: p.liveUrl,
        repoUrl: p.repoUrl,
        repoPrivate: p.repoPrivate,
      };
    });
    return content;
  }, [projects]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    terminalEndRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, [history, focusedProject, focusedContact]);

  const viewOpen = Boolean(focusedContact || focusedProject);

  const closeViews = () => {
    setFocusedProject(null);
    setFocusedContact(null);
    setMatrixRain(false);
  };

  // Vue ouverte : focus sur « Fermer ». Vue fermée : retour à l'invite.
  useEffect(() => {
    if (viewOpen) closeButtonRef.current?.focus();
    else if (!matrixRain) inputRef.current?.focus();
  }, [viewOpen, matrixRain]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C sert aussi à copier : on ne ferme que s'il n'y a pas de sélection.
      const isCtrlC = e.ctrlKey && e.key.toLowerCase() === 'c' && !window.getSelection()?.toString();
      if (e.key === 'Escape' || isCtrlC) closeViews();
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleCommand = (cmdLine: string) => {
    const trimmedCmd = cmdLine.trim();
    if (!trimmedCmd) return;
    setCommandHistory(prev => [trimmedCmd, ...prev]);
    setHistoryIndex(-1);
    const args = trimmedCmd.split(" ");
    const command = args[0].toLowerCase();
    const target = args[1];
    let output = "";

    if (command === "clear") { setHistory([]); return; }

    if (command === "matrix") {
      setMatrixColumns(buildMatrixColumns(28, 18));
      setMatrixRain(true);
      setHistory(prev => [...prev, { type: 'cmd', text: trimmedCmd, path: currentPath }, { type: 'out', text: "Wake up, Neo... (Ctrl+C, Échap ou tap pour sortir)" }]);
      return;
    }

    const easterEgg = getEasterEgg(trimmedCmd, command);
    if (easterEgg) {
      setHistory(prev => [...prev, { type: 'cmd', text: trimmedCmd, path: currentPath }, { type: 'out', text: easterEgg }]);
      return;
    }

    switch (command) {
      case "contact": setFocusedContact(contactData); return;
      case "cat":
        if (target === "contact") { setFocusedContact(contactData); return; }
        const fileData = target ? fileContent[target] : undefined;
        if (fileData && typeof fileData === 'object') { setFocusedProject(fileData); return; }
        output = (typeof fileData === 'string' ? fileData : undefined) || `cat: ${target}: No such file`;
        break;
      case "ls": output = fileSystem[currentPath]?.children.join("   ") || ""; break;
      case "pwd": output = currentPath; break;
      case "help": output = "ls, cd, cat <file>, contact, clear, pwd. (Échap ou Ctrl+C pour fermer une vue)"; break;
      case "cd":
        if (!target || target === "~") setCurrentPath("~");
        else if (target === "..") {
          if (currentPath !== "~") {
            const parts = currentPath.split("/");
            parts.pop();
            setCurrentPath(parts.join("/") || "~");
          }
        } else {
          const newPath = currentPath === "~" ? `~/${target}` : `${currentPath}/${target}`;
          if (fileSystem[newPath]) setCurrentPath(newPath);
          else output = `cd: no such directory: ${target}`;
        }
        break;
      default: output = `command not found: ${command}`;
    }
    setHistory(prev => [...prev, { type: 'cmd', text: trimmedCmd, path: currentPath }, { type: 'out', text: output }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Tab ne complète que si l'invite contient du texte : sinon il navigue normalement.
    if (e.key === "Tab" && !e.shiftKey && input.trim() !== "") {
      e.preventDefault();
      const words = input.split(" ");
      const lastWord = words.pop() || "";
      const match = fileSystem[currentPath]?.children.find((f) => f.startsWith(lastWord));
      if (match) { words.push(match); setInput(words.join(" ")); }
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else { setHistoryIndex(-1); setInput(""); }
    }
  };

  return (
    <PageShell mode="terminal" className="text-gray-300 font-mono" fill>
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl min-h-0 h-[65vh] sm:h-[68vh] flex flex-col bg-[#0d0d0d] border border-[#588157]/30 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden relative">

        {matrixRain && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Fermer l'effet Matrix"
            onClick={closeViews}
            className="absolute inset-0 z-[80] overflow-hidden bg-black cursor-pointer"
          >
            <span className="absolute bottom-3 right-4 z-10 text-xs text-[#00ff41]/70 font-mono uppercase tracking-widest">tap / Échap pour sortir</span>
            <style>{`
              @keyframes matrix-fall {
                0% { transform: translateY(-100%); opacity: 0; }
                10% { opacity: 1; }
                100% { transform: translateY(650%); opacity: 0.2; }
              }
            `}</style>
            {matrixColumns.map((col, i) => (
              <span
                key={i}
                className="absolute top-0 text-[#00ff41] font-mono text-xs leading-4 whitespace-pre"
                style={{
                  left: `${(i / matrixColumns.length) * 100}%`,
                  animation: `matrix-fall ${col.duration}s linear infinite`,
                  animationDelay: `${col.delay}s`,
                }}
              >
                {col.text}
              </span>
            ))}
          </div>
        )}

        {viewOpen && (
          <div role="dialog" aria-modal="true" aria-label={focusedContact ? "Contact" : focusedProject!.title} className="absolute inset-0 bg-[#0d0d0d] z-[60] flex flex-col p-5 sm:p-8 md:p-12 overflow-y-auto animate-in fade-in zoom-in duration-300">
            <div className="flex flex-wrap gap-2 justify-between items-center mb-6 sm:mb-8 border-b border-[#588157]/20 pb-4">
              <span className="text-[#A3B18A] text-xs tracking-widest uppercase font-bold break-words">
                {focusedContact ? "/users/marley/contact" : `Project // ${focusedProject!.title}`}
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeViews}
                className="text-gray-400 hover:text-white text-xs whitespace-nowrap border border-white/10 hover:border-[#588157]/50 rounded px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#588157]"
              >
                [ ESC ] FERMER
              </button>
            </div>

            {focusedContact ? (
              <>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8 tracking-tighter uppercase italic break-words">Contact</h2>
                <div className="max-w-2xl bg-[#588157]/10 border-l-4 border-[#588157] p-4 sm:p-6 mb-8 sm:mb-12 text-base sm:text-lg italic text-gray-200 break-words">&quot;{focusedContact.sumup}&quot;</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-5xl">
                  <div className="space-y-6 sm:space-y-8">
                    <div><p className="text-[#A3B18A] text-xs uppercase font-bold mb-2">Email</p><a href={`mailto:${focusedContact.email}`} className="text-base sm:text-xl text-white hover:text-[#A3B18A] font-semibold break-all">{focusedContact.email}</a></div>
                    <div><p className="text-[#A3B18A] text-xs uppercase font-bold mb-2">GitHub</p><a href={focusedContact.github} target="_blank" rel="noopener noreferrer" className="text-base sm:text-xl text-white hover:text-[#A3B18A] underline decoration-[#344E41] underline-offset-8 break-all">{focusedContact.github}</a></div>
                    <div><p className="text-[#A3B18A] text-xs uppercase font-bold mb-2">LinkedIn</p><a href={focusedContact.linkedin} target="_blank" rel="noopener noreferrer" className="text-base sm:text-xl text-white hover:text-[#A3B18A] underline decoration-[#344E41] underline-offset-8 break-all">{focusedContact.linkedin}</a></div>
                    {focusedContact.links.map((l) => (
                      <div key={l.url}><p className="text-[#A3B18A] text-xs uppercase font-bold mb-2">{l.label}</p><a href={l.url} target="_blank" rel="noopener noreferrer" className="text-base sm:text-xl text-white hover:text-[#A3B18A] underline decoration-[#344E41] underline-offset-8 break-all">{l.url}</a></div>
                    ))}
                  </div>
                  {focusedContact.cvUrl && (
                    <div className="flex flex-col justify-center items-center p-6 sm:p-10 border-2 border-dashed border-[#588157]/20 rounded-2xl bg-[#588157]/10">
                      <p className="text-xs uppercase tracking-[0.4em] mb-6 sm:mb-8 text-gray-400 font-bold text-center">Curriculum Vitæ</p>
                      <a href={focusedContact.cvUrl} target="_blank" rel="noopener noreferrer" className="px-6 sm:px-10 py-3 sm:py-4 bg-[#DAD7CD] text-black font-bold uppercase tracking-wide shadow-[10px_10px_0px_0px_rgba(88,129,87,0.3)] hover:bg-[#3A5A40] hover:text-white transition-all text-sm sm:text-base">VIEW_FULL_CV.PDF</a>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8 tracking-tighter uppercase italic break-words">{focusedProject!.title}</h2>
                <div className="max-w-3xl text-gray-200 leading-relaxed text-base sm:text-lg whitespace-pre-line mb-6 border-l-4 border-[#588157] pl-4 sm:pl-6 py-2 bg-[#588157]/10 break-words">{focusedProject!.description}</div>
                {focusedProject!.highlights && focusedProject!.highlights.length > 0 && (
                  <ul className="max-w-3xl space-y-2 mb-8 sm:mb-10">
                    {focusedProject!.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5 text-sm sm:text-base text-gray-300 leading-relaxed break-words">
                        <span className="mt-1.5 sm:mt-2 w-1.5 h-1.5 rounded-full bg-[#588157] shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
                {focusedProject!.note && (
                  <div className="max-w-3xl flex items-start gap-2.5 text-xs sm:text-sm text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 mb-8 sm:mb-10 break-words">
                    <span aria-hidden className="shrink-0">⚠</span>
                    {focusedProject!.note}
                  </div>
                )}
                {focusedProject!.image && <div className="w-full max-w-4xl mx-auto mb-8 sm:mb-12 border border-[#588157]/20 rounded-lg overflow-hidden shadow-2xl"><img src={focusedProject!.image} alt={focusedProject!.title} className="w-full h-auto" /></div>}
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {focusedProject!.liveUrl && <a href={focusedProject!.liveUrl} target="_blank" rel="noopener noreferrer" className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#DAD7CD] text-black font-bold uppercase tracking-wide hover:bg-[#3A5A40] hover:text-white transition-all text-sm sm:text-base">Voir le site</a>}
                  {focusedProject!.repoUrl ? (
                    <a href={focusedProject!.repoUrl} target="_blank" rel="noopener noreferrer" className="px-5 sm:px-6 py-2.5 sm:py-3 border border-[#588157]/30 text-white font-bold uppercase tracking-wide hover:bg-[#588157]/10 transition-all text-sm sm:text-base">Code source</a>
                  ) : focusedProject!.repoPrivate ? (
                    <span title="Code source privé" className="px-5 sm:px-6 py-2.5 sm:py-3 border border-white/10 text-gray-400 font-bold uppercase tracking-wide text-sm sm:text-base cursor-default">🔒 Repo privé</span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        )}

        <div className="shrink-0 bg-[#1a1a1a] px-3 sm:px-4 py-3 flex items-center justify-between gap-3 border-b border-white/10 shadow-md">
          <div className="flex gap-2 sm:gap-2.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-inner"></div>
          </div>
          <span className="min-w-0 truncate text-xs text-gray-400 font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase">{profile.handle} ~ v4.0</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 scroll-smooth">
          {history.map((line, i) => (
            <div key={i} className="mb-3 text-sm">
              {line.type === 'cmd' ? (
                <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
                  <span className="text-[#A3B18A] font-bold whitespace-nowrap">
                    marley@portfolio:<span className="text-[#588157]">{line.path}</span>$
                  </span>
                  <span className="text-white font-bold tracking-tight break-words">{line.text}</span>
                </div>
              ) : (
                <div className="ml-4 sm:ml-6 text-gray-400 opacity-95 whitespace-pre-wrap leading-relaxed border-l border-white/5 pl-3 sm:pl-4 break-words">{line.text}</div>
              )}
            </div>
          ))}

          <form onSubmit={(e) => { e.preventDefault(); handleCommand(input); setInput(""); }} className="flex items-center gap-x-2 mt-6 pb-12">
            <span className="text-[#A3B18A] font-bold whitespace-nowrap">
              marley@portfolio:<span className="text-[#588157]">{currentPath}</span>$
            </span>
            <input
              ref={inputRef}
              autoFocus
              aria-label="Commande du terminal"
              className="bg-transparent border-none outline-none flex-1 min-w-[80px] text-white font-bold caret-[#588157] text-base"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck="false"
              autoComplete="off"
            />
          </form>
          <div ref={terminalEndRef} />
        </div>
        </div>
      </div>
    </PageShell>
  );
}
