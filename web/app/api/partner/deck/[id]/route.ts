import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { partnerDb, safeName } from "@/lib/partner";
import { R2_BUCKET, r2, r2Configured } from "@/lib/r2";

export const dynamic = "force-dynamic";
const TTL = 600; // seconds

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { db, error } = await partnerDb(req);
  if (!db) return error;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return Response.json({ error: "Not found" }, { status: 404 });

  const { data } = await db.rpc("partner_deck", { p_id: id });
  const deck = data?.[0];
  if (!deck?.deck_path) return Response.json({ error: "No deck" }, { status: 404 });
  const filename = `${deck.number}_${safeName(deck.team_name)}.pdf`;

  if (deck.deck_store === "supabase") {
    const { data: signed } = await db.storage.from("decks").createSignedUrl(deck.deck_path, TTL, { download: filename });
    return signed ? Response.json({ url: signed.signedUrl }) : Response.json({ error: "No deck" }, { status: 404 });
  }
  if (!r2Configured) return Response.json({ error: "Storage not configured" }, { status: 503 });
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: deck.deck_path,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn: TTL },
  );
  return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
}
