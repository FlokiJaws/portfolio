"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { profile } from '@/data/profile';
import { projects } from '@/data/projects';
import { PageNav } from '@/components/PageNav';

type HistoryLine = { type: 'cmd' | 'out'; text: string; path?: string };

type FocusedProject = {
  title: string;
  description: string;
  highlights?: string[];
  note?: string;
  image?: string;
  liveUrl?: string;
  repoUrl?: string;
};

type FocusedContact = {
  sumup: string;
  email: string;
  linkedin: string;
  github: string;
  cvUrl: string;
  links: { label: string; url: string }[];
};

const fileSystem: Record<string, { type: 'dir'; children: string[] }> = {
  "~": { type: "dir", children: ["projects", "skills", "bio.txt", "contact"] },
  "~/projects": { type: "dir", children: projects.map((p) => p.slug) },
  "~/skills": { type: "dir", children: ["languages.txt", "tools.txt"] },
};

const fileContent: Record<string, string | FocusedProject> = {
  "bio.txt": profile.bio,
  "languages.txt": "JS, TS, Python, C++, Rust.",
  "tools.txt": "Git, Docker, Next.js, Linux.",
};
projects.forEach((p) => {
  fileContent[p.slug] = {
    title: p.title,
    description: p.details ?? p.description,
    highlights: p.highlights,
    note: p.note,
    image: p.image,
    liveUrl: p.liveUrl,
    repoUrl: p.repoUrl,
  };
});

const contactData: FocusedContact = {
  sumup: profile.tagline,
  email: profile.email,
  linkedin: profile.linkedin,
  github: profile.github,
  cvUrl: profile.cvUrl,
  links: profile.links,
};

export default function TerminalPage() {
  const [history, setHistory] = useState<HistoryLine[]>([
    { type: 'out', text: "Session CRYPTIS initialisée. Tapez 'help' pour voir les commandes." }
  ]);
  const [input, setInput] = useState("");
  const [currentPath, setCurrentPath] = useState("~");

  const [focusedProject, setFocusedProject] = useState<FocusedProject | null>(null);
  const [focusedContact, setFocusedContact] = useState<FocusedContact | null>(null);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, focusedProject, focusedContact]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'c') {
        setFocusedProject(null);
        setFocusedContact(null);
      }
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
      case "help": output = "ls, cd, cat <file>, contact, clear, pwd. (Ctrl+C pour fermer une vue)"; break;
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
    if (e.key === "Tab") {
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
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-mono p-3 sm:p-4 flex flex-col items-center justify-center">

      <div className="w-full max-w-5xl mb-4 sm:mb-6">
        <PageNav mode="terminal" />
      </div>

      <div className="mb-6 sm:mb-10 select-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
        <Image src="/logo_cryptis.svg" alt="Logo" width={320} height={80} priority className="h-12 sm:h-16 md:h-20 w-auto" />
      </div>

      <div className="w-full max-w-5xl bg-[#0d0d0d] border border-blue-500/30 rounded-xl h-[70vh] sm:h-[75vh] min-h-[380px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden relative">

        {(focusedContact || focusedProject) && (
          <div className="absolute inset-0 bg-[#0d0d0d] z-[60] flex flex-col p-5 sm:p-8 md:p-12 overflow-y-auto animate-in fade-in zoom-in duration-300">
            <div className="flex flex-wrap gap-2 justify-between items-center mb-6 sm:mb-8 border-b border-blue-500/20 pb-4">
              <span className="text-blue-400 text-[10px] tracking-widest uppercase font-bold italic break-words">
                {focusedContact ? "/users/marley/contact" : `Project // ${focusedProject!.title}`}
              </span>
              <span className="text-gray-500 text-[10px] whitespace-nowrap">[ CTRL+C ] TO EXIT</span>
            </div>

            {focusedContact ? (
              <>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8 tracking-tighter uppercase italic break-words">Contact</h2>
                <div className="max-w-2xl bg-blue-500/5 border-l-4 border-blue-500 p-4 sm:p-6 mb-8 sm:mb-12 text-base sm:text-lg italic text-gray-200 break-words">&quot;{focusedContact.sumup}&quot;</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-5xl">
                  <div className="space-y-6 sm:space-y-8">
                    <div><p className="text-blue-400 text-[10px] uppercase font-bold mb-2">Email</p><a href={`mailto:${focusedContact.email}`} className="text-base sm:text-xl text-white hover:text-blue-400 font-bold italic break-all">{focusedContact.email}</a></div>
                    <div><p className="text-blue-400 text-[10px] uppercase font-bold mb-2">GitHub</p><a href={focusedContact.github} target="_blank" rel="noopener noreferrer" className="text-base sm:text-xl text-white hover:text-blue-400 underline decoration-blue-900 underline-offset-8 italic break-all">{focusedContact.github}</a></div>
                    <div><p className="text-blue-400 text-[10px] uppercase font-bold mb-2">LinkedIn</p><a href={focusedContact.linkedin} target="_blank" rel="noopener noreferrer" className="text-base sm:text-xl text-white hover:text-blue-400 underline decoration-blue-900 underline-offset-8 italic break-all">{focusedContact.linkedin}</a></div>
                    {focusedContact.links.map((l) => (
                      <div key={l.url}><p className="text-blue-400 text-[10px] uppercase font-bold mb-2">{l.label}</p><a href={l.url} target="_blank" rel="noopener noreferrer" className="text-base sm:text-xl text-white hover:text-blue-400 underline decoration-blue-900 underline-offset-8 italic break-all">{l.url}</a></div>
                    ))}
                  </div>
                  {focusedContact.cvUrl && (
                    <div className="flex flex-col justify-center items-center p-6 sm:p-10 border-2 border-dashed border-blue-500/20 rounded-2xl bg-blue-500/5">
                      <p className="text-[10px] uppercase tracking-[0.4em] mb-6 sm:mb-8 text-gray-500 font-black italic text-center">Curriculum Vitæ</p>
                      <a href={focusedContact.cvUrl} target="_blank" rel="noopener noreferrer" className="px-6 sm:px-10 py-3 sm:py-4 bg-white text-black font-black uppercase tracking-tighter shadow-[10px_10px_0px_0px_rgba(59,130,246,0.3)] hover:bg-blue-600 hover:text-white transition-all text-sm sm:text-base">VIEW_FULL_CV.PDF</a>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8 tracking-tighter uppercase italic break-words">{focusedProject!.title}</h2>
                <div className="max-w-3xl text-gray-200 leading-relaxed text-base sm:text-lg whitespace-pre-line mb-6 border-l-4 border-blue-500 pl-4 sm:pl-6 py-2 bg-blue-500/5 break-words">{focusedProject!.description}</div>
                {focusedProject!.highlights && focusedProject!.highlights.length > 0 && (
                  <ul className="max-w-3xl space-y-2 mb-8 sm:mb-10">
                    {focusedProject!.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5 text-sm sm:text-base text-gray-300 leading-relaxed break-words">
                        <span className="mt-1.5 sm:mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
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
                {focusedProject!.image && <div className="w-full max-w-4xl mx-auto mb-8 sm:mb-12 border border-blue-500/20 rounded-lg overflow-hidden shadow-2xl"><img src={focusedProject!.image} alt={focusedProject!.title} className="w-full h-auto" /></div>}
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {focusedProject!.liveUrl && <a href={focusedProject!.liveUrl} target="_blank" rel="noopener noreferrer" className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-black font-black uppercase tracking-tighter hover:bg-blue-600 hover:text-white transition-all text-sm sm:text-base">Voir le site</a>}
                  {focusedProject!.repoUrl && <a href={focusedProject!.repoUrl} target="_blank" rel="noopener noreferrer" className="px-5 sm:px-6 py-2.5 sm:py-3 border border-blue-500/30 text-white font-black uppercase tracking-tighter hover:bg-blue-500/10 transition-all text-sm sm:text-base">Code source</a>}
                </div>
              </>
            )}
          </div>
        )}

        <div className="bg-[#1a1a1a] px-3 sm:px-4 py-3 flex items-center justify-between gap-3 border-b border-white/10 shadow-md">
          <div className="flex gap-2 sm:gap-2.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-inner"></div>
          </div>
          <span className="min-w-0 truncate text-[9px] sm:text-[10px] text-gray-400 font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase italic">{profile.handle} ~ v4.0</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 scroll-smooth h-[calc(100%-48px)]">
          {history.map((line, i) => (
            <div key={i} className="mb-3 text-sm">
              {line.type === 'cmd' ? (
                <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
                  <span className="text-[#00ff41] font-bold drop-shadow-[0_0_8px_rgba(0,255,65,0.4)] whitespace-nowrap">
                    marley@portfolio:<span className="text-blue-400">{line.path}</span>$
                  </span>
                  <span className="text-white font-bold tracking-tight break-words">{line.text}</span>
                </div>
              ) : (
                <div className="ml-4 sm:ml-6 text-gray-400 opacity-95 whitespace-pre-wrap leading-relaxed border-l border-white/5 pl-3 sm:pl-4 break-words">{line.text}</div>
              )}
            </div>
          ))}

          <form onSubmit={(e) => { e.preventDefault(); handleCommand(input); setInput(""); }} className="flex items-center gap-x-2 mt-6 pb-12">
            <span className="text-[#00ff41] font-bold whitespace-nowrap drop-shadow-[0_0_8px_rgba(0,255,65,0.4)]">
              marley@portfolio:<span className="text-blue-400">{currentPath}</span>$
            </span>
            <input
              autoFocus
              className="bg-transparent border-none outline-none flex-1 min-w-[80px] text-white font-bold caret-blue-500 text-base"
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
  );
}
