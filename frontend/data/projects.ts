export interface Project {
  /** Identifiant unique, utilisé comme nom de "fichier" dans le terminal (sans espace). */
  slug: string;
  title: string;
  /** Résumé court affiché sur la carte / dans le fichier. */
  description: string;
  /** Intro courte affichée en haut de la vue détaillée (modale en mode simple, "cat" en mode terminal). Retombe sur `description` si absent. */
  details?: string;
  /** Liste à puces des fonctionnalités clés, affichée sous `details`. */
  highlights?: string[];
  /** Petite mise en garde affichée à part (ex: temps de démarrage, compte de démo...). */
  note?: string;
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
    slug: "plateforme-ctf",
    title: "Plateforme CTF",
    description:
      "Plateforme de gestion de compétitions CTF (Capture The Flag) façon Root-Me/CTFd/CTFtime, avec rôles, équipes et messagerie.",
    details:
      "Projet de M1 Informatique (Applications distribuées JEE, Université de Limoges, 2025-2026), réalisé en binôme. Trois rôles : Administrateur, Organisateur, Participant.",
    highlights: [
      "Gestion des CTF : création, modération, publication, compteur de vues",
      "Inscription / désinscription des participants aux CTF",
      "Équipes : candidature validée par un chef d'équipe, transfert du rôle",
      "Défis d'entraînement avec points et classement général",
      "Commentaires publics sur les CTF",
      "Messagerie privée (1 à 1) entre utilisateurs",
    ],
    note: "Hébergé sur le tier gratuit de Render : le premier chargement peut prendre 30 à 50 secondes, le temps que le service se réveille.",
    context: "Master",
    year: "2025-2026",
    tags: ["React", "Quarkus", "JPA/Hibernate", "PostgreSQL", "Docker"],
    liveUrl: "https://plateforme-ctf.onrender.com/",
    repoUrl: "https://github.com/FlokiJaws/plateforme_ctf",
  },
  {
    slug: "portfolio",
    title: "Portfolio",
    description:
      "Ce site : un faux terminal pour les curieux, et une version simplifiée pour les recruteurs.",
    context: "Perso",
    year: "2026",
    tags: ["Next.js", "TypeScript", "Tailwind"],
    repoUrl: "https://github.com/FlokiJaws/portfolio",
  },
];
