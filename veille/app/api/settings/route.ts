import { authed, body, json } from "@/lib/api";
import { saveSettings } from "@/lib/settings";

export const PUT = authed(async (req) => json({ settings: await saveSettings(await body(req)) }));
