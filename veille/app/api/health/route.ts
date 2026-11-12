import { json } from "@/lib/api";
import { pool, ready } from "@/lib/db";

export async function GET() {
  try {
    await ready();
    await pool().query("SELECT 1");
    return json({ ok: true });
  } catch {
    return json({ ok: false }, 503);
  }
}
