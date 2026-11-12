import { authed, json } from "@/lib/api";
import { collectAll } from "@/lib/collect";

export const POST = authed(async () => {
  // La collecte continue en arrière-plan si elle dépasse 20 s (pagination NVD) : l'app n'attend pas.
  const run = collectAll().catch(() => null);
  const summary = await Promise.race([run, new Promise<null>((r) => setTimeout(() => r(null), 20_000))]);
  return json({ done: summary !== null, summary });
});
