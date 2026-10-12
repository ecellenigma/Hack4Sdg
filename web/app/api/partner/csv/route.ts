import { cell, partnerDb, sdgLabel, type PartnerRow } from "@/lib/partner";

export const dynamic = "force-dynamic";

const HEAD = ["Entry", "Team", "SDG", "Project title", "Summary", "Member", "Team lead email", "Team lead phone", "Submitted at", "Updated at"];

export async function GET(req: Request) {
  const { db, error } = await partnerDb(req);
  if (!db) return error;
  const { data, error: e } = await db.rpc("partner_submissions");
  if (e) return Response.json({ error: "Could not load submissions" }, { status: 500 });

  const lines = [HEAD.map(cell).join(",")];
  for (const r of (data ?? []) as PartnerRow[]) {
    const names = r.members?.length ? r.members : [""];
    for (const m of names) {
      lines.push([r.number, r.team_name, sdgLabel(r.sdg), r.title, r.summary, m, r.contact_email, r.contact_phone, r.created_at, r.updated_at].map(cell).join(","));
    }
  }
  // BOM so Excel reads it as UTF-8.
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="hack4sdg-registrations.csv"', "Cache-Control": "no-store" },
  });
}
