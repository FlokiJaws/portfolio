import Link from 'next/link';
import { profile } from '@/data/profile';
import { projects } from '@/data/projects';

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <p className="text-blue-400 text-xs uppercase tracking-widest font-bold mb-3">Portfolio</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">{profile.name}</h1>
          <p className="text-gray-400 text-lg mb-6">{profile.tagline}</p>
          <p className="text-gray-500 max-w-2xl mb-8">{profile.bio}</p>
          <div className="flex flex-wrap gap-3">
            <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
              Télécharger le CV
            </a>
            <a href={`mailto:${profile.email}`} className="px-5 py-2.5 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
              {profile.email}
            </a>
            <a href={profile.github} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
              GitHub
            </a>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
              LinkedIn
            </a>
            {profile.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
        </header>

        <section>
          <h2 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-6">Projets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {projects.map((p) => (
              <div key={p.slug} className="border border-white/10 rounded-xl p-6 bg-[#0d0d0d] flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{p.title}</h3>
                  <span className="text-[10px] uppercase tracking-wide text-blue-400">{p.context}{p.year ? ` · ${p.year}` : ''}</span>
                </div>
                <p className="text-sm text-gray-400 mb-4 flex-1">{p.description}</p>
                {p.tags && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.tags.map((t) => (
                      <span key={t} className="text-[10px] uppercase tracking-wide bg-white/5 text-gray-400 px-2 py-1 rounded">{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  {p.liveUrl && (
                    <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white hover:text-blue-400 transition-colors">
                      Voir le site →
                    </a>
                  )}
                  {p.repoUrl && (
                    <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-400 hover:text-blue-400 transition-colors">
                      Code source →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <Link href="/terminal" className="mt-16 inline-block text-[10px] uppercase tracking-widest text-gray-500 hover:text-blue-400 transition-colors">
          ← Mode terminal
        </Link>
      </div>
    </div>
  );
}
