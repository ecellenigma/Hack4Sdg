import { supabase } from "@/lib/supabase";

export const MAX_BYTES = 15 * 1024 * 1024;

export function deckProblem(file: File): string {
  if (file.type !== "application/pdf") return "That isn't a PDF. Export your slides as PDF first.";
  if (file.size > MAX_BYTES) return "That file is over 15 MB.";
  return "";
}

/** Uploads a deck PDF and says where it landed, or why it didn't. */
export async function uploadDeck(file: File): Promise<{ path: string; store: "r2" | "supabase" } | { error: string }> {
  const signed = await fetch("/api/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ size: file.size }) });
  if (!signed.ok) return { error: (await signed.json().catch(() => null))?.error ?? "Could not start the upload." };
  const { store: planned, key: path, url } = await signed.json();
  let store: "r2" | "supabase" = planned;
  if (planned === "r2") {
    const up = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file }).catch(() => null);
    if (!up?.ok) store = "supabase"; // R2 unreachable: fall back
  }
  if (store === "supabase") {
    const up = await supabase.storage.from("decks").upload(path, file, { contentType: "application/pdf" });
    if (up.error) return { error: "Upload failed. Check your connection and try again." };
  }
  return { path, store };
}
