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
  bio: "Développeur passionné par la cybersécurité, Node.js et Linux.",
  email: "ton.email@example.com",
  // Place le fichier dans frontend/public/cv.pdf
  cvUrl: "/cv.pdf",
  github: "https://github.com/tonpseudo",
  linkedin: "https://linkedin.com/in/tonpseudo",
  links: [
    { label: "Site personnel", url: "https://example.com" },
  ],
};
