import Image from 'next/image';
import { profile } from '@/data/profile';
import { projects } from '@/data/projects';
import { PageNav } from '@/components/PageNav';
import { ProjectCard } from '@/components/ProjectCard';
import { IconMail, IconDownload, IconGithub, IconLinkedin, IconExternalLink } from '@/components/icons';

export default function SimplePage() {
  const initial = profile.name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10">
        <div className="mb-10 sm:mb-12">
          <PageNav mode="simple" />
        </div>

        <header className="relative mb-16 sm:mb-20">
          <div
            aria-hidden
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                width={96}
                height={96}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-3xl sm:text-4xl font-black text-white shrink-0 shadow-lg shadow-blue-950/50">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-blue-400 text-xs uppercase tracking-widest font-bold mb-2">Portfolio</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight break-words">{profile.name}</h1>
              <p className="text-gray-400 text-base sm:text-lg mt-1 break-words">{profile.tagline}</p>
            </div>
          </div>

          <p className="relative text-gray-400 leading-relaxed max-w-2xl mb-8 break-words">{profile.bio}</p>

          <div className="relative flex flex-wrap gap-3">
            <a
              href={profile.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors shadow-lg shadow-black/20"
            >
              <IconDownload className="w-4 h-4" />
              Télécharger le CV
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/15 rounded-lg text-sm hover:bg-white/5 hover:border-white/30 transition-colors break-all"
            >
              <IconMail className="w-4 h-4 shrink-0" />
              {profile.email}
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/15 rounded-lg text-sm hover:bg-white/5 hover:border-white/30 transition-colors"
            >
              <IconGithub className="w-4 h-4" />
              GitHub
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/15 rounded-lg text-sm hover:bg-white/5 hover:border-white/30 transition-colors"
            >
              <IconLinkedin className="w-4 h-4" />
              LinkedIn
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

        <section>
          <h2 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-6">
            Projets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </section>

        <footer className="mt-16 sm:mt-20 pt-8 border-t border-white/5">
          <PageNav mode="simple" />
        </footer>
      </div>
    </div>
  );
}
