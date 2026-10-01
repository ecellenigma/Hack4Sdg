"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    router.push("/judge");
  }

  return (
    <main style={{ minHeight: "100%", display: "grid", placeItems: "center", padding: 24 }}>
      <form onSubmit={submit} className="rise" style={{ width: "100%", maxWidth: 400, border: "2px solid var(--ink)", background: "var(--paper)", padding: 32, boxShadow: "8px 8px 0 var(--ink)" }}>
        <p className="label">Hack for SDG · Judging desk</p>
        <h1 style={{ fontSize: 44, margin: "8px 0 24px" }}>Sign in</h1>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ margin: "4px 0 16px" }} />
        <label className="label" htmlFor="pw">Password</label>
        <input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={{ margin: "4px 0 24px" }} />
        <button className="btn" disabled={busy} style={{ width: "100%" }}>{busy ? "…" : "Enter"}</button>
        {msg && <p role="alert" style={{ color: "var(--accent)", marginTop: 16 }}>{msg}</p>}
        <p style={{ color: "var(--ink-soft)", fontSize: 12, marginTop: 20 }}>Judge accounts are created by the organisers. Ask them if you need access.</p>
      </form>
    </main>
  );
}
