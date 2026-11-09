export interface Link {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  handle: string;
  tagline: string;
  bio: string;
  email: string;
  cvUrl: string;
  github: string;
  linkedin: string;
  links: Link[];
}

// Modifie ces valeurs directement, pas de redéploiement de backend nécessaire.
export const profile: Profile = {
  name: "Marley",
  handle: "marley@cryptis-shell",
  tagline: "Étudiant en Master CRYPTIS — Cybersécurité",
  bio: "Mec simple qui aime coder, apprendre de nouvelles technos et bidouiller avec l'IA. À côté de ça : sport et muscu, sorties entre potes, jeux vidéo et jeux de rôle.",
  email: "marleycatillon@icloud.com",
  // Place le fichier dans frontend/public/cv.pdf
  cvUrl: "/cv.pdf",
  github: "https://github.com/FlokiJaws",
  linkedin: "https://linkedin.com/in/marleycatillon",
  links: [],
};
