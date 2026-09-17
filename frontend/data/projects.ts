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
  /** true si le code est privé : affiche un badge "Repo privé" au lieu d'un lien. */
  repoPrivate?: boolean;
}

// Pour ajouter un projet : copie un objet ci-dessous et modifie les champs.
export const projects: Project[] = [
  {
    slug: "diagnostic-ia",
    title: "Diagnostic médical IA",
    description:
      "Système multi-agents (IA) simulant une réunion médicale : deux IA débattent d'un diagnostic, un module note automatiquement la qualité de leurs arguments.",
    details:
      "Projet de Master (2025-2026, Université de Limoges), réalisé en équipe de 5. Deux IA « médecins » débattent d'un diagnostic à partir des symptômes d'un patient : l'une cherche l'explication la plus simple, l'autre s'assure de ne pas passer à côté d'une maladie rare. L'utilisateur (le médecin traitant) garde le contrôle du débat à tout moment.",
    highlights: [
      "Deux IA aux approches opposées : diagnostic le plus probable vs maladies rares à ne pas manquer",
      "Recherche automatique dans une base de documents médicaux pour appuyer chaque argument",
      "Module CRIT : note chaque argument selon sa solidité et la fiabilité de sa source",
      "Le médecin humain peut ajouter des résultats d'examens, réorienter le débat ou forcer un consensus",
      "Rapport final avec diagnostics priorisés, lisible à voix haute (synthèse vocale)",
      "Interface complète (Streamlit) + interface légère (Gradio) pour des tests rapides",
    ],
    note: "Projet de recherche académique sans démo en ligne : l'application se lance en local.",
    context: "Master",
    year: "2025-2026",
    tags: ["Python", "LangGraph", "RAG", "Streamlit"],
  },
  {
    slug: "gamerclash",
    title: "GamerClash",
    description:
      "Plateforme e-commerce sur mesure pour un magasin gaming/TCG, avec catalogue hiérarchique, panier persistant et panneau d'administration complet.",
    details:
      "Stage de Licence 3 Informatique (8 semaines, mars-mai 2025) chez Gamecash Limoges, magasin spécialisé jeux vidéo et cartes à collectionner. Développement en autonomie, de l'analyse des besoins au déploiement, d'une solution permettant au gérant de choisir précisément quels produits vendre en ligne — sans dépendre d'une solution imposant tout le stock du magasin physique.",
    highlights: [
      "Catalogue hiérarchique (Gaming, Rétro, Goodies, TCG) avec recherche, filtres et tri",
      "Fiches produits avec aperçu rapide et badges de grade pour les cartes à collectionner",
      "Panier persistant entre sessions, calcul automatique des frais de livraison",
      "Authentification avec vérification d'email, rôles client/admin",
      "Emails transactionnels automatiques (confirmation, expédition, avis)",
      "Panneau d'administration complet : produits, commandes avec suivi de statut, avis clients",
    ],
    note: "Démo en ligne : catalogue de produits de test (pas le catalogue réel du magasin) et paiement simulé — aucune vraie transaction n'est effectuée.",
    context: "Stage",
    year: "2025",
    tags: ["React", "Firebase", "Firestore", "Node.js"],
    liveUrl: "https://gamerclash.vercel.app/",
    repoPrivate: true,
  },
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
