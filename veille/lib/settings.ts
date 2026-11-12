import { kvGet, kvSet } from "./db";
import { normalizeSettings, type Settings } from "./rules.ts";

export async function getSettings(): Promise<Settings> {
  return normalizeSettings(await kvGet("settings"));
}

export async function saveSettings(input: unknown): Promise<Settings> {
  const settings = normalizeSettings(input);
  await kvSet("settings", settings);
  return settings;
}
