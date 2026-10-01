"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppBar, { Stripe } from "../appbar";

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar />
      <main style={{ flex: 1, display: "grid", placeItems: "center", padding: "48px 24px" }}>
        <form onSubmit={submit} className="rise" style={{ width: "100%", maxWidth: 440 }}>
          <p className="label">Judges only</p>
          <h1 style={{ fontSize: "clamp(48px, 9vw, 80px)", margin: "10px 0 32px" }}>
            The judging <em style={{ color: "var(--yellow)" }}>desk.</em>
          </h1>
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 7 }}>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              <label className="label" htmlFor="pw">Password</label>
              <input id="pw" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="btn" disabled={busy} style={{ marginTop: 6 }}>{busy ? "Signing in…" : "Enter"}</button>
          </div>
          {msg && <p role="alert" style={{ color: "var(--red)", marginTop: 16 }}>{msg}</p>}
          <p style={{ color: "var(--mute)", fontSize: 14, marginTop: 28 }}>
            Judge accounts are created by the organisers. Ask them if you need access.
          </p>
        </form>
      </main>
      <Stripe />
    </div>
  );
}
