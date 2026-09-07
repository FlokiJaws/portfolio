import Link from 'next/link';
import { profile } from '@/data/profile';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 flex flex-col items-center justify-center p-6 font-mono">
      <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic mb-2">{profile.name}</h1>
      <p className="text-gray-500 text-sm mb-16 text-center max-w-md">{profile.tagline}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Link
          href="/terminal"
          className="group border border-blue-500/30 rounded-xl p-8 bg-[#0d0d0d] hover:bg-blue-500/5 transition-colors flex flex-col items-start"
        >
          <span className="text-[10px] uppercase tracking-widest text-blue-400 mb-3">$_</span>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Mode terminal</h2>
          <p className="text-sm text-gray-500">Pour ceux qui connaissent les commandes de base (ls, cd, cat...).</p>
        </Link>

        <Link
          href="/simple"
          className="group border border-white/10 rounded-xl p-8 bg-[#0d0d0d] hover:bg-white/5 transition-colors flex flex-col items-start"
        >
          <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">☐</span>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Version simplifiée</h2>
          <p className="text-sm text-gray-500">Projets, liens et CV, tout cliquable, sans rien à taper.</p>
        </Link>
      </div>
    </div>
  );
}
