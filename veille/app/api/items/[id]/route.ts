import { authed, body, json } from "@/lib/api";
import { getItem, updateItem } from "@/lib/items";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  return /^\d{1,15}$/.test(raw) ? Number(raw) : null;
}

export const GET = authed(async (_req: Request, ctx: Ctx) => {
  const id = parseId((await ctx.params).id);
  const item = id === null ? null : await getItem(id);
  return item ? json({ item }) : json({ error: "Introuvable" }, 404);
});

export const PATCH = authed(async (req: Request, ctx: Ctx) => {
  const id = parseId((await ctx.params).id);
  const data = await body(req);
  const item =
    id === null
      ? null
      : await updateItem(id, {
          read: typeof data.read === "boolean" ? data.read : undefined,
          starred: typeof data.starred === "boolean" ? data.starred : undefined,
        });
  return item ? json({ item }) : json({ error: "Introuvable" }, 404);
});
