import type { Project } from '@/data/projects';

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:1337';

type StrapiProject = {
  title: string;
  slug: string;
  description: string;
  details?: string | null;
  highlights?: string | null;
  note?: string | null;
  context: string;
  year?: string | null;
  tags?: string | null;
  liveUrl?: string | null;
  repoUrl?: string | null;
  repoPrivate?: boolean | null;
  image?: { url: string } | null;
};

function absoluteUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${CMS_URL}${url}`;
}

function splitLines(value: string | undefined | null): string[] | undefined {
  if (!value) return undefined;
  const items = value.split('\n').map((line) => line.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function splitCommas(value: string | undefined | null): string[] | undefined {
  if (!value) return undefined;
  const items = value.split(',').map((tag) => tag.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapProject(p: StrapiProject): Project {
  return {
    slug: p.slug || slugify(p.title),
    title: p.title,
    description: p.description,
    details: p.details ?? undefined,
    highlights: splitLines(p.highlights),
    note: p.note ?? undefined,
    context: p.context.trim(),
    year: p.year ?? undefined,
    tags: splitCommas(p.tags),
    image: absoluteUrl(p.image?.url),
    liveUrl: p.liveUrl ?? undefined,
    repoUrl: p.repoUrl ?? undefined,
    repoPrivate: p.repoPrivate ?? undefined,
  };
}

/** Récupère les projets depuis le CMS Strapi. Retourne un tableau vide si l'API est injoignable. */
export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${CMS_URL}/api/projects?populate=image&sort=year:desc`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items: StrapiProject[] = json.data ?? [];
    return items.map(mapProject);
  } catch {
    return [];
  }
}
