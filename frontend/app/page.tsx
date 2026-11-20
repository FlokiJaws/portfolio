import Link from 'next/link';
import { profile } from '@/data/profile';
import { languages, tools } from '@/data/skills';
import { IconMail, IconDownload, IconGithub, IconLinkedin, IconArrowRight } from '@/components/icons';

// Compétences mises en avant sur l'accueil (le détail complet est dans les deux vues).
const keySkills = [
  ...languages.slice(0, 4).map((s) => s.name),
  ...tools.slice(0, 3).map((s) => s.name),
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-300 flex flex-col items-center justify-center px-6 py-12">
      <div className="relative w-full max-w-3xl">
        <div
          aria-hidden
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#588157]/15 blur-3xl pointer-events-none"
        />

        <header className="relative text-center mb-10 sm:mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[#A3B18A] mb-3">{profile.handle}</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3 break-words">{profile.name}</h1>
          <p className="text-gray-300 text-base sm:text-lg break-words">{profile.tagline}</p>

          <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Compétences clés">
            {keySkills.map((skill) => (
              <li
                key={skill}
                className="font-mono text-xs text-[#A3B18A] bg-[#588157]/10 border border-[#588157]/25 rounded-full px-3 py-1"
              >
                {skill}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={profile.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DAD7CD] text-black text-sm font-bold rounded-lg hover:bg-[#3A5A40] hover:text-white transition-colors"
            >
              <IconDownload className="w-4 h-4" />
              CV
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/15 rounded-lg text-sm hover:bg-white/5 hover:border-white/30 transition-colors"
            >
              <IconMail className="w-4 h-4" />
              Me contacter
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="inline-flex items-center justify-center w-10 h-10 border border-white/15 rounded-lg hover:bg-white/5 hover:border-white/30 transition-colors"
            >
              <IconGithub className="w-4 h-4" />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="inline-flex items-center justify-center w-10 h-10 border border-white/15 rounded-lg hover:bg-white/5 hover:border-white/30 transition-colors"
            >
              <IconLinkedin className="w-4 h-4" />
            </a>
          </div>
        </header>

        <p className="relative text-center text-xs uppercase tracking-widest text-gray-400 mb-4">Choisis ta vue</p>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Link
            href="/terminal"
            className="group border border-[#588157]/30 rounded-xl p-6 sm:p-8 bg-[#0d0d0d] hover:bg-[#588157]/10 hover:border-[#588157]/60 transition-colors flex flex-col items-start"
          >
            <span aria-hidden className="font-mono text-sm text-[#A3B18A] mb-3">
              $ ls<span className="animate-pulse">_</span>
            </span>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              Mode terminal
              <IconArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </h2>
            <p className="text-sm text-gray-400">Explore le portfolio avec ls, cd et cat. Quelques surprises cachées.</p>
          </Link>

          <Link
            href="/simple"
            className="group border border-white/10 rounded-xl p-6 sm:p-8 bg-[#0d0d0d] hover:bg-white/5 hover:border-white/25 transition-colors flex flex-col items-start"
          >
            <span aria-hidden className="font-mono text-sm text-gray-400 mb-3">▤ projets · expérience</span>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              Version simplifiée
              <IconArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </h2>
            <p className="text-sm text-gray-400">Projets, expérience, compétences et CV, tout cliquable, rien à taper.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
