import { profile } from '@/data/profile';
import { getProjects } from '@/lib/cms';
import { PageShell } from '@/components/PageShell';
import { ProjectCard } from '@/components/ProjectCard';
import { IconMail, IconDownload, IconGithub, IconLinkedin, IconExternalLink } from '@/components/icons';

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
    </PageShell>
  );
}
