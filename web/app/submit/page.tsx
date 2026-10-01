"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SDG_COLORS, SDG_NAMES } from "@/lib/sdg";

const MAX_BYTES = 15 * 1024 * 1024;

function SubmitForm() {
  const preset = Number(useSearchParams().get("sdg")) || 0;
  const [sdg, setSdg] = useState(preset >= 1 && preset <= 18 ? preset : 0);
  const [members, setMembers] = useState(["", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const f = new FormData(e.currentTarget);
    const file = f.get("deck") as File;
    const names = members.map((m) => m.trim()).filter(Boolean);
    if (!sdg) return setErr("Pick a goal.");
    if (!names.length) return setErr("Add at least one team member.");
    if (file.type !== "application/pdf") return setErr("The deck must be a PDF.");
    if (file.size > MAX_BYTES) return setErr("The PDF must be under 15 MB.");

    setBusy(true);
    const id = crypto.randomUUID();
    const signed = await fetch("/api/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ size: file.size }) });
    if (!signed.ok) { setBusy(false); return setErr((await signed.json().catch(() => null))?.error ?? "Could not start the upload."); }
    const { store: planned, key: path, url } = await signed.json();
    let store: "r2" | "supabase" = planned;
    if (planned === "r2") {
      const up = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file }).catch(() => null);
      if (!up?.ok) store = "supabase"; // R2 unreachable: fall back
    }
    if (store === "supabase") {
      const up = await supabase.storage.from("decks").upload(path, file, { contentType: "application/pdf" });
      if (up.error) { setBusy(false); return setErr("Upload failed. Check your connection and try again."); }
    }
    const ins = await supabase.from("submissions").insert({
      id,
      team_name: String(f.get("team")).trim(),
      members: names,
      contact_email: String(f.get("email")).trim(),
      sdg,
      title: String(f.get("title")).trim(),
      summary: String(f.get("summary")).trim() || null,
      deck_path: path,
      deck_store: store,
    });
    setBusy(false);
    if (ins.error) return setErr(ins.error.message);
    setDone(true);
  }

  if (done)
    return (
      <main style={{ minHeight: "100%", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <div className="rise">
          <p className="label">Received</p>
          <h1 style={{ fontSize: "clamp(44px, 8vw, 80px)", margin: "8px 0 16px" }}>You&apos;re in.</h1>
          <p style={{ marginBottom: 24 }}>Your deck is submitted. The organisers will be in touch by email.</p>
          <Link className="btn" href="/" style={{ textDecoration: "none", display: "inline-block" }}>Back home</Link>
        </div>
      </main>
    );

  const field = { display: "grid", gap: 6 } as const;
  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 96px" }}>
      <Link href="/" className="label">← Hack for SDG</Link>
      <h1 className="rise" style={{ fontSize: "clamp(44px, 8vw, 80px)", margin: "8px 0 8px" }}>Submit your idea</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 32 }}>One submission per team (max 4 members). Upload your presentation as a PDF, 15 MB or less. Judging is blind: judges never see team names, so leave your names, college and logos off the slides.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 24 }}>
        <div style={field}>
          <label className="label" htmlFor="team">Team name</label>
          <input id="team" name="team" type="text" required maxLength={100} />
        </div>

        <fieldset style={{ border: 0, display: "grid", gap: 8 }}>
          <legend className="label" style={{ marginBottom: 6 }}>Members (up to 4)</legend>
          {members.map((m, i) => (
            <input key={i} type="text" aria-label={`Member ${i + 1}`} placeholder={`Member ${i + 1}${i ? " (optional)" : ""}`} value={m} maxLength={80}
              onChange={(e) => setMembers((p) => p.map((v, j) => (j === i ? e.target.value : v)))} />
          ))}
        </fieldset>

        <div style={field}>
          <label className="label" htmlFor="email">Contact email</label>
          <input id="email" name="email" type="email" required />
        </div>

        <div style={field}>
          <label className="label" htmlFor="sdg">Sustainable Development Goal</label>
          <select id="sdg" value={sdg} onChange={(e) => setSdg(+e.target.value)} required
            style={{ border: "2px solid var(--ink)", borderLeft: `12px solid ${sdg ? SDG_COLORS[sdg] : "var(--ink)"}`, background: "#fbf9f2", padding: 10, font: "inherit" }}>
            <option value={0}>Choose a goal…</option>
            {Object.entries(SDG_NAMES).map(([n, name]) => <option key={n} value={n}>{n === "18" ? "18. Student innovation (your own idea)" : `${n}. ${name}`}</option>)}
          </select>
        </div>

        <div style={field}>
          <label className="label" htmlFor="title">Project title</label>
          <input id="title" name="title" type="text" required maxLength={200} />
        </div>

        <div style={field}>
          <label className="label" htmlFor="summary">One-line summary (optional)</label>
          <textarea id="summary" name="summary" rows={3} maxLength={500} />
        </div>

        <div style={field}>
          <label className="label" htmlFor="deck">Presentation (PDF)</label>
          <input id="deck" name="deck" type="file" accept="application/pdf" required style={{ border: "2px dashed var(--ink)", padding: 16, font: "inherit" }} />
        </div>

        {err && <p role="alert" style={{ color: "var(--accent)" }}>{err}</p>}
        <button className="btn" disabled={busy}>{busy ? "Uploading…" : "Submit"}</button>
      </form>
    </main>
  );
}

export default function Submit() {
  return (
    <Suspense>
      <SubmitForm />
    </Suspense>
  );
}
