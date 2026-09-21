import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-mono flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl border border-[#588157]/30 bg-[#0d0d0d] rounded-xl p-6 sm:p-8">
        <p className="text-[#A3B18A] font-bold text-sm mb-4">
          marley@portfolio:~$ <span className="text-white">cd page-introuvable</span>
        </p>
        <p className="text-gray-400 text-sm mb-1">bash: cd: page-introuvable: No such file or directory</p>
        <p className="text-[#588157] text-6xl sm:text-7xl font-black tracking-tighter mt-6 mb-8">404</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-[#A3B18A] border border-white/10 rounded-full px-4 py-2 transition-colors"
          >
            ← Accueil
          </Link>
          <Link
            href="/simple"
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-[#A3B18A] border border-white/10 rounded-full px-4 py-2 transition-colors"
          >
            Version simplifiée
          </Link>
          <Link
            href="/terminal"
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-[#A3B18A] border border-white/10 rounded-full px-4 py-2 transition-colors"
          >
            Mode terminal
          </Link>
        </div>
      </div>
    </div>
  );
}
