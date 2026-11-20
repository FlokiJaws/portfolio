import type { Metadata } from 'next';
import { profile } from '@/data/profile';
import { experiences } from '@/data/experiences';
import { languages, tools } from '@/data/skills';
import { getProjects } from '@/lib/cms';
import { PageShell } from '@/components/PageShell';
import { ProjectCard } from '@/components/ProjectCard';
import { IconMail, IconDownload, IconGithub, IconLinkedin, IconExternalLink } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Version simplifiée',
};

export default async function SimplePage() {
  const projects = await getProjects();

  return (
    <PageShell mode="simple" className="text-gray-200">
      <header className="relative mb-16 sm:mb-20">
        <div
          aria-hidden
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#588157]/15 blur-3xl pointer-events-none"
        />
        <div className="relative">
          <p className="text-[#A3B18A] text-xs uppercase tracking-widest font-bold mb-2">Portfolio</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight break-words">{profile.name}</h1>
          <p className="text-gray-400 text-base sm:text-lg mt-1 break-words">{profile.tagline}</p>
        </div>

        <p className="relative text-gray-400 leading-relaxed max-w-2xl mt-6 mb-8 break-words">{profile.bio}</p>

        <div className="relative flex flex-wrap gap-3">
          <a
            href={profile.cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DAD7CD] text-black text-sm font-bold rounded-lg hover:bg-[#3A5A40] hover:text-white transition-colors shadow-lg shadow-black/20"
          >
            <IconDownload className="w-4 h-4" />
            Télécharger le CV
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#588157]/50 bg-[#588157]/10 text-white rounded-lg text-sm font-semibold hover:bg-[#588157]/20 transition-colors break-all"
          >
            <IconMail className="w-4 h-4 shrink-0" />
            {profile.email}
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
            className="inline-flex items-center justify-center w-10 h-10 border border-white/15 rounded-lg hover:bg-white/5 hover:border-white/30 transition-colors"
          >
            <IconGithub className="w-4 h-4" />
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            title="LinkedIn"
            className="inline-flex items-center justify-center w-10 h-10 border border-white/15 rounded-lg hover:bg-white/5 hover:border-white/30 transition-colors"
          >
            <IconLinkedin className="w-4 h-4" />
          </a>
          {profile.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/15 rounded-lg text-sm hover:bg-white/5 hover:border-white/30 transition-colors"
            >
              <IconExternalLink className="w-4 h-4" />
              {l.label}
            </a>
          ))}
        </div>
      </header>

      <section className="mb-16 sm:mb-20">
        <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">
          Expérience
        </h2>
        <div className="space-y-5">
          {experiences.map((exp) => (
            <div key={`${exp.role}-${exp.org}`} className="border border-white/10 rounded-xl p-5 sm:p-6 bg-[#0d0d0d]">
              <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
                <h3 className="text-base font-bold text-white break-words">
                  {exp.role} <span className="text-gray-400 font-normal">— {exp.org}{exp.place ? `, ${exp.place}` : ''}</span>
                </h3>
                <span className="shrink-0 text-xs uppercase tracking-wide text-[#A3B18A] bg-[#588157]/15 px-2 py-1 rounded-full whitespace-nowrap">
                  {exp.period}
                </span>
              </div>
              {exp.description && (
                <p className="text-sm text-gray-400 break-words">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16 sm:mb-20">
        <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">
          Compétences
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { title: 'Langages', items: languages },
            { title: 'Outils & technos', items: tools },
          ].map((group) => (
            <div key={group.title} className="border border-white/10 rounded-xl p-5 sm:p-6 bg-[#0d0d0d]">
              <h3 className="text-sm font-bold text-white mb-4">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.items.map((skill) => (
                  <li key={skill.name} className="text-sm break-words">
                    <span className="font-semibold text-[#A3B18A]">{skill.name}</span>
                    <span className="text-gray-400"> — {skill.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6">
          Projets
        </h2>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 border border-dashed border-white/10 rounded-xl p-6">
            Les projets sont momentanément indisponibles. Retrouve-les sur{' '}
            <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-[#A3B18A] underline underline-offset-4 hover:text-white">
              GitHub
            </a>
            .
          </p>
        )}
      </section>
    </PageShell>
  );
}
