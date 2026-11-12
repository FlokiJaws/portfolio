import { authed, json } from "@/lib/api";
import { sendPush } from "@/lib/push";

export const POST = authed(async () => {
  const result = await sendPush({
    title: "Veille Cyber",
    body: "Les notifications fonctionnent. Tu seras prévenu des éléments critiques.",
    url: "/?tab=critical",
    tag: "test",
  });
  return json(result, result.sent > 0 ? 200 : 502);
});
