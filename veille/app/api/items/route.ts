import { authed, json } from "@/lib/api";
import { counts, listItems, parseQuery } from "@/lib/items";

export const GET = authed(async (req) => {
  const query = parseQuery(new URL(req.url).searchParams);
  const [page, totals] = await Promise.all([listItems(query), counts()]);
  return json({ ...page, counts: totals });
});
