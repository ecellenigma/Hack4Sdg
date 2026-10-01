import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MAX_DECK_BYTES, R2_BUCKET, r2 } from "@/lib/r2";

// Public: any team can request a one-shot upload URL for a single PDF of a declared size.
export async function POST(req: Request) {
  const { size } = (await req.json().catch(() => ({}))) as { size?: number };
  if (!Number.isInteger(size) || size! <= 0 || size! > MAX_DECK_BYTES)
    return Response.json({ error: "The PDF must be under 15 MB." }, { status: 400 });

  const key = `${crypto.randomUUID()}.pdf`;
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: "application/pdf", ContentLength: size }),
    { expiresIn: 600 },
  );
  return Response.json({ key, url });
}
