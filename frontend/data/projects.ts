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
  /** URL absolue de l'image (fournie par le CMS). */
  image?: string;
  liveUrl?: string;
  repoUrl?: string;
  /** true si le code est privé : affiche un badge "Repo privé" au lieu d'un lien. */
  repoPrivate?: boolean;
}
