"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SDG_COLORS, SDG_NAMES, onColor } from "@/lib/sdg";
import type { PartnerRow } from "@/lib/partner";
import AppBar, { Stripe } from "../appbar";
import "./partner.css";

const REFRESH_MS = 60_000;

export default function Partner() {
  const router = useRouter();
  const [rows, setRows] = useState<PartnerRow[] | null>(null);
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [err, setErr] = useState("");
  const [at, setAt] = useState<Date | null>(null);
  const [q, setQ] = useState("");
  const [sdg, setSdg] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState("");

  const call = useCallback(async (path: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return null; }
    return fetch(path, { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
  }, [router]);

  const load = useCallback(async () => {
    const r = await call("/api/partner/submissions");
    if (!r) return;
    if (r.status === 401) return router.replace("/login");
    if (r.status === 403) return setState("denied");
    if (!r.ok) return setErr("Could not refresh. Retrying in a minute.");
    const j = await r.json();
    setRows(j.rows);
    setAt(new Date());
    setErr("");
    setState("ready");
  }, [call, router]);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  async function deck(id: string) {
    setBusy(id);
    const r = await call(`/api/partner/deck/${id}`);
    setBusy("");
    if (!r) return;
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) return setErr(r.status === 404 ? "No deck for this team." : "Could not get the deck. Try again.");
    window.location.href = j.url; // attachment disposition: the browser downloads instead of navigating
  }

  async function csv() {
    setBusy("csv");
    const r = await call("/api/partner/csv");
    setBusy("");
    if (!r || !r.ok) return setErr("Could not export.");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await r.blob());
    a.download = "hack4sdg-registrations.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (!sdg || r.sdg === sdg) &&
        (!needle || [r.team_name, r.contact_email, r.title, ...r.members].some((s) => s?.toLowerCase().includes(needle))),
    );
  }, [rows, q, sdg]);

  const stats = useMemo(() => {
    const per: Record<number, number> = {};
    let people = 0;
    for (const r of rows ?? []) { per[r.sdg] = (per[r.sdg] ?? 0) + 1; people += r.members.length; }
    return { teams: rows?.length ?? 0, people, per };
  }, [rows]);

  const when = (s: string) => new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

  if (state === "loading") return <Shell><p style={{ color: "var(--mute)" }}>Loading…</p></Shell>;
  if (state === "denied") return <Shell><p role="alert" style={{ color: "var(--red)" }}>This account doesn&apos;t have partner access.</p></Shell>;

  return (
    <Shell>
      <p className="label">Partner view · read only</p>
      <h1 style={{ fontSize: "clamp(44px, 8vw, 96px)", margin: "10px 0 0" }}>
        Registra<em style={{ color: "var(--yellow)" }}>tions.</em>
      </h1>
      <div className="pt-stats">
        <div><b>{stats.teams}</b><span className="label">Teams</span></div>
        <div><b>{stats.people}</b><span className="label">Participants</span></div>
      </div>
      <div className="pt-sdgs">
        {Object.entries(stats.per).sort((a, b) => +a[0] - +b[0]).map(([n, c]) => (
          <span key={n} style={{ "--c": SDG_COLORS[+n], "--fg-on": onColor(SDG_COLORS[+n]) } as React.CSSProperties}>SDG {n} · {c}</span>
        ))}
      </div>

      <div className="pt-tools">
        <input type="text" aria-label="Search" placeholder="Search team, member, email, project" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filter by SDG" value={sdg} onChange={(e) => setSdg(+e.target.value)}>
          <option value={0}>All SDGs</option>
          {Object.entries(SDG_NAMES).map(([n, name]) => <option key={n} value={n}>{n}. {name}</option>)}
        </select>
        <button className="btn small ghost" onClick={load}>Refresh</button>
        <button className="btn small" onClick={csv} disabled={busy === "csv"}>Export CSV</button>
      </div>
      <p className="label" style={{ marginBottom: 16 }}>
        {at ? `Last updated ${at.toLocaleTimeString("en-IN", { hour12: false })}` : ""} · refreshes every minute · newest first · {shown.length} shown
      </p>
      {err && <p role="alert" style={{ color: "var(--red)", marginBottom: 12 }}>{err}</p>}

      {shown.map((r) => {
        const c = SDG_COLORS[r.sdg];
        const isOpen = open === r.id;
        return (
          <article key={r.id} className="pt-row" style={{ "--c": c } as React.CSSProperties}>
            <div className="pt-head">
              <div>
                <span className="label">#{r.number} · SDG {r.sdg} {SDG_NAMES[r.sdg]}</span>
                <h3>{r.team_name}</h3>
                <p className="pt-meta">{r.title} · {r.members.length} member{r.members.length === 1 ? "" : "s"} · submitted {when(r.created_at)}</p>
              </div>
              <div className="pt-actions">
                <button className="btn small ghost" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.id)}>{isOpen ? "Hide" : "Details"}</button>
                <button className="btn small" disabled={busy === r.id} onClick={() => deck(r.id)}>{busy === r.id ? "…" : "Download deck"}</button>
              </div>
            </div>
            {isOpen && (
              <div className="pt-detail">
                <div>
                  <span className="label">Members</span>
                  <ul>{r.members.map((m, i) => <li key={i}>{m}{i === 0 ? " (lead)" : ""}</li>)}</ul>
                </div>
                <div>
                  <span className="label">Team lead contact</span>
                  <p><a href={`mailto:${r.contact_email}`}>{r.contact_email}</a><br />{r.contact_phone || "No phone"}</p>
                </div>
                <div>
                  <span className="label">Project</span>
                  <p><b style={{ color: "var(--fg)" }}>{r.title}</b><br />{r.summary || "No summary"}</p>
                </div>
                <div>
                  <span className="label">Timeline</span>
                  <p>Submitted {when(r.created_at)}<br />Updated {when(r.updated_at)}</p>
                </div>
              </div>
            )}
          </article>
        );
      })}
      {!shown.length && <p style={{ color: "var(--mute)" }}>No teams match.</p>}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh" }}>
      <AppBar>
        <button className="label" style={{ background: "none", border: 0 }} onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }}>Sign out</button>
      </AppBar>
      <main className="pt">{children}</main>
      <Stripe />
    </div>
  );
}
