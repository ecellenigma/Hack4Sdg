import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import { R2_BUCKET, r2 } from "@/lib/r2";

// Judges only: verifies the caller's Supabase session, then signs a short-lived read URL.
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const path = new URL(req.url).searchParams.get("path");
  if (!token || !path) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Row-level security runs as the caller, so this only succeeds for approved judges.
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data } = await db.from("submissions").select("id").eq("deck_path", path).maybeSingle();
  if (!data) return Response.json({ error: "Forbidden" }, { status: 403 });

  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: path, ResponseContentType: "application/pdf", ResponseContentDisposition: "inline" }),
    { expiresIn: 3600 },
  );
  return Response.json({ url });
}
