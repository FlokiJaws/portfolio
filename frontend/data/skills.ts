export interface Skill {
  name: string;
  detail: string;
}

// Source unique : affichée par `cat skills/*.txt` (terminal) et par la version simplifiée.
export const languages: Skill[] = [
  { name: "Python", detail: "scripting, IA (LangGraph, RAG)" },
  { name: "C", detail: "crypto, calcul parallèle (MPI/OpenMP)" },
  { name: "Java", detail: "back-end (Quarkus)" },
  { name: "TypeScript/JS", detail: "web (React, Next.js, Node.js)" },
  { name: "SQL", detail: "PostgreSQL, requêtes, sécurité (anti-injection)" },
  { name: "Rust", detail: "bases, en apprentissage" },
];

export const tools: Skill[] = [
  { name: "Linux (Ubuntu)", detail: "administration, durcissement" },
  { name: "Docker / Compose", detail: "conteneurisation, déploiement" },
  { name: "Kubernetes", detail: "bases, en formation" },
  { name: "Git / GitHub Actions", detail: "versioning, CI/CD" },
  { name: "PostgreSQL", detail: "bases de données relationnelles" },
  { name: "Firebase", detail: "auth, Firestore, Cloud Functions" },
  { name: "Strapi", detail: "CMS headless (ce portfolio)" },
  { name: "React / Next.js", detail: "interfaces web" },
  { name: "Quarkus", detail: "back-end Java, API REST" },
  { name: "Caddy", detail: "reverse proxy, HTTPS auto" },
  { name: "LangGraph / RAG", detail: "agents IA, Chroma" },
  { name: "MPI / OpenMP", detail: "calcul parallèle (C)" },
];

/** Rendu texte aligné, façon fichier .txt du terminal. */
export function formatSkills(skills: Skill[]): string {
  const width = Math.max(...skills.map((s) => s.name.length)) + 1;
  return skills.map((s) => `${s.name.padEnd(width)}-- ${s.detail}`).join("\n");
}
