import { authed, json } from "@/lib/api";
import { counts, markAllRead, parseQuery } from "@/lib/items";

export const POST = authed(async (req) => {
  const updated = await markAllRead(parseQuery(new URL(req.url).searchParams));
  return json({ updated, counts: await counts() });
});
