export interface Project {
  /** Identifiant unique, utilisé comme nom de "fichier" dans le terminal (sans espace). */
  slug: string;
  title: string;
  description: string;
  /** D'où vient le projet : fac, master, perso... */
  context: string;
  year?: string;
  tags?: string[];
  /** Chemin dans frontend/public, ex: "/projects/mon-projet.png". Optionnel. */
  image?: string;
  liveUrl?: string;
  repoUrl?: string;
}

// Pour ajouter un projet : copie un objet ci-dessous et modifie les champs.
export const projects: Project[] = [
  {
    slug: "portfolio",
    title: "Portfolio",
    description:
      "Ce site : un faux terminal pour les curieux, et une version simplifiée pour les recruteurs.",
    context: "Perso",
    year: "2026",
    tags: ["Next.js", "TypeScript", "Tailwind"],
    repoUrl: "https://github.com/tonpseudo/portfolio",
  },
];
