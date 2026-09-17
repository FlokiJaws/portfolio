import Link from 'next/link';

export function PageNav({ mode }: { mode: 'terminal' | 'simple' }) {
  const otherHref = mode === 'terminal' ? '/simple' : '/terminal';
  const otherLabel = mode === 'terminal' ? 'Version simplifiée' : 'Mode terminal';

  return (
    <nav className="flex items-center justify-between gap-3 font-mono">
      <Link
        href="/"
        className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 hover:text-[#A3B18A] border border-white/10 rounded-full px-3 py-1.5 transition-colors whitespace-nowrap"
      >
        ← Accueil
      </Link>
      <Link
        href={otherHref}
        className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 hover:text-[#A3B18A] border border-white/10 rounded-full px-3 py-1.5 transition-colors whitespace-nowrap"
      >
        {otherLabel} →
      </Link>
    </nav>
  );
}
