import { createClient } from "@supabase/supabase-js";
import { SDG_NAMES } from "@/lib/sdg";

export type PartnerRow = {
  id: string;
  number: number;
  team_name: string;
  members: string[];
  contact_email: string;
  contact_phone: string | null;
  sdg: number;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

/** Verifies the caller is an approved partner. Every query runs as the caller, so RLS and the RPC checks apply. */
export async function partnerDb(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data, error } = await db.rpc("is_partner");
  if (error) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  if (data !== true) return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  return { db };
}

export function sdgLabel(n: number) {
  return `SDG ${n}: ${SDG_NAMES[n] ?? ""}`.trim();
}

/** Strips characters that break filenames and headers. */
export function safeName(s: string) {
  return s.normalize("NFKD").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "team";
}

/** Quotes a CSV cell and defuses spreadsheet formulas (=, +, -, @), but leaves plain phone numbers alone. */
export function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^\+?[0-9][0-9 ()-]{6,19}$/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
