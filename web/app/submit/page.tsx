"use client";
import "./submit.css";
import { Suspense, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PROBLEMS } from "@/lib/problems";
import { SDG_COLORS, SDG_NAMES, onColor } from "@/lib/sdg";
import { DEADLINE_LABEL, FINALS_LABEL } from "@/lib/event";
import { MAX_BYTES, deckProblem, uploadDeck } from "@/lib/upload";
import AppBar, { Stripe } from "../appbar";
import Countdown, { useSecondsLeft } from "../countdown";

const ENTRY_KEY = "h4s-entry"; // "<id>.<token>" of this browser's last submission
const noSubscribe = () => () => {};

function SubmitForm() {
  const preset = Number(useSearchParams().get("sdg")) || 0;
  const [sdg, setSdg] = useState(preset >= 1 && preset <= 18 ? preset : 0);
  const [members, setMembers] = useState(["", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ link: string; number?: number } | null>(null);
  const left = useSecondsLeft();
  const earlier = useSyncExternalStore(noSubscribe, () => localStorage.getItem(ENTRY_KEY), () => null);
  const [deck, setDeck] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const deckInput = useRef<HTMLInputElement>(null);

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
    const token = crypto.randomUUID();
    const up = await uploadDeck(file);
    if ("error" in up) { setBusy(false); return setErr(up.error); }
    const row = {
      id,
      team_name: String(f.get("team")).trim(),
      members: names,
      contact_email: String(f.get("email")).trim(),
      contact_phone: String(f.get("phone")).trim(),
      sdg,
      title: String(f.get("title")).trim(),
      summary: String(f.get("summary")).trim() || null,
      deck_path: up.path,
      deck_store: up.store,
    };
    let ins = await supabase.from("submissions").insert({ ...row, edit_token: token });
    const receipts = ins.error?.code !== "PGRST204"; // no edit_token column yet: submit without a receipt link
    if (!receipts) ins = await supabase.from("submissions").insert(row);
    setBusy(false);
    if (ins.error) return setErr(ins.error.code === "42501" ? "Submissions are closed." : ins.error.message);
    if (!receipts) return setDone({ link: "" });
    const link = `${id}.${token}`;
    localStorage.setItem(ENTRY_KEY, link);
    const { data } = await supabase.rpc("submission_receipt", { p_id: id, p_token: token });
    setDone({ link, number: data?.[0]?.number });
  }

  if (done)
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <AppBar />
        <main style={{ flex: 1, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div className="rise">
            <p className="label">{done.number ? `Entry ${String(done.number).padStart(3, "0")} received` : "Received"}</p>
            <h1 style={{ fontSize: "clamp(56px, 11vw, 140px)", margin: "10px 0 20px" }}>
              You&apos;re <em style={{ color: "var(--yellow)" }}>in.</em>
            </h1>
            <p style={{ color: "var(--mute)", marginBottom: 32, maxWidth: "40ch", marginInline: "auto" }}>
              Your deck is submitted and will go to the judges without your names on it. The organisers will email you.
            </p>
            {done.link && (
              <p style={{ color: "var(--mute)", marginBottom: 32, maxWidth: "44ch", marginInline: "auto" }}>
                <Link href={`/entry#${done.link}`} style={{ color: "var(--yellow)" }}>Open your entry page</Link> and bookmark it.
                That private link is the only way to replace your deck before {DEADLINE_LABEL}.
              </p>
            )}
            <Link className="btn" href="/">Back home</Link>
          </div>
        </main>
        <Stripe />
      </div>
    );

  if (left !== null && left <= 0)
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <AppBar><Link href="/" className="label">← Back</Link></AppBar>
        <main style={{ flex: 1, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div className="rise">
            <p className="label">Round 1</p>
            <h1 style={{ fontSize: "clamp(48px, 9vw, 120px)", margin: "10px 0 20px" }}>
              Submissions are <em style={{ color: "var(--yellow)" }}>closed.</em>
            </h1>
            <p style={{ color: "var(--mute)", marginBottom: 32, maxWidth: "44ch", marginInline: "auto" }}>
              Round 1 closed on {DEADLINE_LABEL}. The ten best teams go to the offline final round on {FINALS_LABEL}.
            </p>
            <Link className="btn" href="/">Back home</Link>
          </div>
        </main>
        <Stripe />
      </div>
    );

  const field = { display: "grid", gap: 7 } as const;
  const accent = sdg ? SDG_COLORS[sdg] : "var(--yellow)";
  const deckBad = deck ? deckProblem(deck) : "";
  return (
    <div>
      <AppBar><Link href="/" className="label">← Back</Link></AppBar>
      <main className="submit-grid">
        <aside className="submit-side rise">
          <p className="label">Submissions</p>
          <h1 style={{ fontSize: "clamp(48px, 7vw, 96px)", margin: "10px 0 24px" }}>
            Submit your <em style={{ color: "var(--yellow)" }}>idea.</em>
          </h1>
          <ul className="rules">
            <li><b>1</b>One submission per team, up to four members.</li>
            <li><b>2</b>A single PDF, 15 MB or less. Using PowerPoint or Slides? Export as PDF first.</li>
            <li><b>3</b>Judging is blind. Leave your names, college and logos off the slides.</li>
            <li><b>4</b><span>Submissions close on {DEADLINE_LABEL}. <Countdown /></span></li>
          </ul>
          {earlier && (
            <p className="hint" style={{ marginTop: 18 }}>
              Already submitted from this browser? <Link href={`/entry#${earlier}`} style={{ color: "var(--yellow)" }}>Open your entry</Link> to replace the deck.
            </p>
          )}
        </aside>

        <form onSubmit={onSubmit} className="submit-form rise" style={{ animationDelay: "120ms", ["--accent" as string]: accent }}>
          <div style={field}>
            <label className="label" htmlFor="team">Team name</label>
            <input id="team" name="team" type="text" required maxLength={100} />
          </div>

          <fieldset style={{ border: 0, display: "grid", gap: 8 }}>
            <legend className="label" style={{ marginBottom: 8 }}>Members (up to 4)</legend>
            {members.map((m, i) => (
              <input key={i} type="text" aria-label={`Member ${i + 1}`} placeholder={i === 0 ? "Member 1 (team lead)" : `Member ${i + 1} (optional)`} value={m} maxLength={80}
                onChange={(e) => setMembers((p) => p.map((v, j) => (j === i ? e.target.value : v)))} />
            ))}
          </fieldset>

          <div className="two">
            <div style={field}>
              <label className="label" htmlFor="email">Team lead email</label>
              <input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div style={field}>
              <label className="label" htmlFor="phone">Team lead phone</label>
              <input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="+91 98765 43210" pattern="\+?[0-9 ()\-]{7,20}" title="Digits, spaces and + only, 7 to 20 characters" />
            </div>
          </div>

          <div style={field}>
            <span className="label" id="sdg-label">Sustainable Development Goal</span>
            <div className="goal-grid" role="radiogroup" aria-labelledby="sdg-label">
              {Object.keys(SDG_COLORS).map((k) => {
                const g = +k;
                return (
                  <button key={g} type="button" role="radio" aria-checked={g === sdg} aria-label={`Goal ${g}: ${SDG_NAMES[g]}`} title={SDG_NAMES[g]}
                    onClick={() => setSdg(g)} style={{ background: SDG_COLORS[g], color: onColor(SDG_COLORS[g]) }}>
                    {g === 18 ? "+" : g}
                  </button>
                );
              })}
            </div>
            {sdg ? (
              <div className="goal-pick" key={sdg} style={{ background: SDG_COLORS[sdg], color: onColor(SDG_COLORS[sdg]) }}>
                <b>{sdg === 18 ? "Student innovation (your own idea)" : `${sdg}. ${SDG_NAMES[sdg]}`}</b>
                <p>{PROBLEMS[sdg]}</p>
              </div>
            ) : (
              <p className="hint">Pick a tile to see its problem statement.</p>
            )}
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
            <div
              className={`drop${drag ? " over" : ""}${deck ? " has" : ""}${deckBad ? " bad" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const files = e.dataTransfer.files;
                if (!files.length || !deckInput.current) return;
                deckInput.current.files = files;
                setDeck(files[0]);
              }}
            >
              <input ref={deckInput} id="deck" name="deck" type="file" accept="application/pdf" required onChange={(e) => setDeck(e.target.files?.[0] ?? null)} />
              {deck ? (
                <>
                  <b>{deck.name}</b>
                  <span>{deckBad || `${(deck.size / 1024 / 1024).toFixed(1)} MB · click to replace`}</span>
                </>
              ) : (
                <>
                  <b>Drop your PDF here</b>
                  <span>or click to browse · 15 MB max</span>
                </>
              )}
            </div>
          </div>

          {err && <p role="alert" style={{ color: "var(--red)" }}>{err}</p>}
          {busy && <div className="progress" role="progressbar" aria-label="Uploading your deck"><i /></div>}
          <button className="btn" disabled={busy}>{busy ? "Uploading…" : "Submit idea →"}</button>
        </form>
      </main>
      <Stripe />
    </div>
  );
}

export default function Submit() {
  return (
    <Suspense>
      <SubmitForm />
    </Suspense>
  );
}
