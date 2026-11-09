export interface Experience {
  role: string;
  org: string;
  place?: string;
  period: string;
  description?: string;
}

export const experiences: Experience[] = [
  {
    role: "Stagiaire développeur full-stack",
    org: "GAMER CLASH SARL (Gamecash)",
    place: "Limoges",
    period: "03/2025 – 05/2025 (8 semaines)",
    description:
      "Conception et mise en production en autonomie d'une plateforme e-commerce (React, Firebase, Node.js, Vercel), de l'analyse des besoins au déploiement.",
  },
  {
    role: "Employé polyvalent",
    org: "Gamecash",
    place: "Limoges",
    period: "09/2025 – 06/2026 · CDI étudiant",
    description: "Conseil client, rachat de produits d'occasion, diagnostic et remise en état.",
  },
  {
    role: "Employé drive et rayon fruits & légumes",
    org: "Super U",
    period: "depuis 06/2026 · CDI étudiant",
    description: "Rayon géré seul le week-end : mise en rayon, fraîcheur des produits, tenue du rayon.",
  },
  {
    role: "Intervenant",
    org: "Lycée Saint-Jean",
    period: "2025–2026 · projet de M1",
    description: "Introduction au Big Data, à l'IA et à la cybersécurité auprès de classes de SNT.",
  },
];
