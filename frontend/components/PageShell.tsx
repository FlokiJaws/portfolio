import type { ReactNode } from 'react';
import { PageNav } from './PageNav';

export function PageShell({
  mode,
  className,
  fill,
  children,
}: {
  mode: 'terminal' | 'simple';
  className?: string;
  /** Verrouille le shell à exactement la hauteur de l'écran (pas de scroll de page) ; les enfants doivent gérer leur propre `flex-1 min-h-0`. */
  fill?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`bg-[#0a0a0a] ${fill ? 'h-[100dvh] overflow-hidden flex flex-col' : 'min-h-screen'} ${className ?? ''}`}>
      <div className={`max-w-5xl mx-auto w-full px-4 sm:px-6 md:px-8 py-6 sm:py-10 ${fill ? 'flex flex-col flex-1 min-h-0' : ''}`}>
        <div className="mb-8 sm:mb-10 shrink-0">
          <PageNav mode={mode} />
        </div>
        {children}
      </div>
    </div>
  );
}
