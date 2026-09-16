"use client";

import { useEffect, useState } from 'react';
import type { Project } from '@/data/projects';
import { IconGithub, IconArrowRight } from './icons';

export function ProjectCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <div className="group border border-white/10 rounded-xl p-5 sm:p-6 bg-[#0d0d0d] flex flex-col transition-colors hover:border-blue-500/40 hover:bg-blue-500/[0.03]">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-bold text-white break-words">{project.title}</h3>
          <span className="shrink-0 text-[10px] uppercase tracking-wide text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full whitespace-nowrap">
            {project.context}{project.year ? ` · ${project.year}` : ''}
          </span>
        </div>
        <p className="text-sm text-gray-400 mb-4 flex-1 break-words">{project.description}</p>
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map((t) => (
              <span key={t} className="text-[10px] uppercase tracking-wide bg-white/5 text-gray-400 px-2 py-1 rounded">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-4 pt-3 border-t border-white/5">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-white hover:text-blue-400 transition-colors"
          >
            Détails <IconArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-blue-400 transition-colors"
            >
              <IconGithub className="w-3.5 h-3.5" /> Code source
            </a>
          )}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#0d0d0d] border border-blue-500/30 rounded-2xl p-6 sm:p-8 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-xl leading-none"
            >
              ✕
            </button>

            <span className="text-[10px] uppercase tracking-wide text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
              {project.context}{project.year ? ` · ${project.year}` : ''}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-4 mb-4 tracking-tight break-words">{project.title}</h3>
            <p className="text-gray-300 leading-relaxed mb-5 break-words">
              {project.details ?? project.description}
            </p>

            {project.highlights && project.highlights.length > 0 && (
              <ul className="space-y-2 mb-6">
                {project.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm text-gray-300 leading-relaxed break-words">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            )}

            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map((t) => (
                  <span key={t} className="text-[10px] uppercase tracking-wide bg-white/5 text-gray-400 px-2 py-1 rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {project.note && (
              <div className="flex items-start gap-2.5 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 mb-6 break-words">
                <span aria-hidden className="shrink-0">⚠</span>
                {project.note}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                >
                  Voir le site
                </a>
              )}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/15 rounded-lg text-sm hover:bg-white/5 hover:border-white/30 transition-colors"
                >
                  <IconGithub className="w-4 h-4" /> Code source
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
