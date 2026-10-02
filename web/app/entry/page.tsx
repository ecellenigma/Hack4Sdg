"use client";
import "../submit/submit.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SDG_NAMES } from "@/lib/sdg";
import { DEADLINE_LABEL } from "@/lib/event";
import { deckProblem, uploadDeck } from "@/lib/upload";
import AppBar, { Stripe } from "../appbar";

type Receipt = { number: number; team_name: string; title: string; sdg: number; created_at: string; editable: boolean };

// Reached through the private link shown after submitting: /entry#<id>.<token>
export default function Entry() {
  const [key, setKey] = useState<{ id: string; token: string } | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ready">("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const [id, token] = window.location.hash.slice(1).split(".");
      const { data } = id && token ? await supabase.rpc("submission_receipt", { p_id: id, p_token: token }) : { data: null };
      if (!data?.length) return setState("missing");
      setKey({ id, token });
      setReceipt(data[0] as Receipt);
      setState("ready");
    })();
  }, []);

  async function onReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !key) return;
    setMsg("");
    setErr(deckProblem(file));
    if (deckProblem(file)) return;
    setBusy(true);
    const up = await uploadDeck(file);
    if ("error" in up) { setBusy(false); return setErr(up.error); }
    const { data, error } = await supabase.rpc("replace_deck", { p_id: key.id, p_token: key.token, p_path: up.path, p_store: up.store });
    setBusy(false);
    if (error || !data) return setErr(error?.message ?? "Could not replace the deck.");
    setMsg(`Deck replaced with ${file.name}.`);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar><Link href="/" className="label">← Home</Link></AppBar>
      <main style={{ flex: 1, width: "100%", maxWidth: 720, margin: "0 auto", padding: "56px 28px 96px" }}>
        {state === "missing" && (
          <>
            <p className="label">Your entry</p>
            <h1 style={{ fontSize: "clamp(40px, 6vw, 72px)", margin: "10px 0 20px" }}>Entry not found.</h1>
            <p style={{ color: "var(--mute)", maxWidth: "46ch" }}>
              This page only opens from the private link you got right after submitting. Check that you copied the whole link.
            </p>
          </>
        )}
        {receipt && (
          <div className="rise">
            <p className="label">Your entry</p>
            <h1 style={{ fontSize: "clamp(56px, 11vw, 128px)", margin: "10px 0 28px" }}>
              Entry <em style={{ color: "var(--yellow)" }}>{String(receipt.number).padStart(3, "0")}</em>
            </h1>
            <ul className="rules" style={{ marginBottom: 36 }}>
              <li><b>·</b><span>{receipt.team_name}</span></li>
              <li><b>·</b><span>{receipt.title}</span></li>
              <li><b>·</b><span>{receipt.sdg === 18 ? "Student innovation (your own idea)" : `Goal ${receipt.sdg}: ${SDG_NAMES[receipt.sdg]}`}</span></li>
              <li><b>·</b><span>Submitted {new Date(receipt.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span></li>
            </ul>
            {receipt.editable ? (
              <>
                <label className={`drop${busy ? " over" : ""}`}>
                  <input type="file" accept="application/pdf" disabled={busy} onChange={onReplace} aria-label="Replace your deck with a new PDF" />
                  <b>{busy ? "Uploading…" : "Replace your deck"}</b>
                  <span>Drop in a new PDF, 15 MB max. You can do this until {DEADLINE_LABEL}.</span>
                </label>
                {busy && <div className="progress" role="progressbar" aria-label="Uploading your deck" style={{ marginTop: 16 }}><i /></div>}
              </>
            ) : (
              <p style={{ color: "var(--mute)" }}>Submissions are closed, so this deck is final.</p>
            )}
            {msg && <p role="status" style={{ color: "var(--ok)", marginTop: 16 }}>{msg}</p>}
            {err && <p role="alert" style={{ color: "var(--red)", marginTop: 16 }}>{err}</p>}
          </div>
        )}
      </main>
      <Stripe />
    </div>
  );
}
