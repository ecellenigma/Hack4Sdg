import { partnerDb } from "@/lib/partner";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { db, error } = await partnerDb(req);
  if (!db) return error;
  const { data, error: e } = await db.rpc("partner_submissions");
  if (e) return Response.json({ error: "Could not load submissions" }, { status: 500 });
  return Response.json({ rows: data ?? [], at: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
