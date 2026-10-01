"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, type Criterion, type Judge, type Submission } from "@/lib/supabase";
import { SDG_COLORS, SDG_NAMES, onColor } from "@/lib/sdg";
import { Logo } from "../appbar";
import "./judge.css";

type ScoreMap = Record<string, Record<number, number>>; // submission -> criterion -> value

export default function JudgeDesk() {
  const router = useRouter();
  const [judge, setJudge] = useState<Judge | null>(null);
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [subs, setSubs] = useState<Submission[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<ScoreMap>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<number, number>>({});
  const [note, setNote] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [sdgFilter, setSdgFilter] = useState(0);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace("/login");
      const uid = session.user.id;
      const { data: j } = await supabase.from("judges").select("*").eq("user_id", uid).maybeSingle();
      if (!j) return setState("denied");
      setJudge(j);
      const [s, c, sc, cm] = await Promise.all([
        supabase.from("submissions").select("id,number,sdg,title,summary,deck_path,created_at").order("number"),
        supabase.from("criteria").select("*").order("position"),
        supabase.from("scores").select("submission_id,criterion_id,value").eq("judge_id", uid),
        supabase.from("comments").select("submission_id,body").eq("judge_id", uid),
      ]);
      setSubs((s.data ?? []) as Submission[]);
      setCriteria((c.data ?? []) as Criterion[]);
      const map: ScoreMap = {};
      for (const r of sc.data ?? []) (map[r.submission_id] ??= {})[r.criterion_id] = Number(r.value);
      setScores(map);
      setComments(Object.fromEntries((cm.data ?? []).map((r) => [r.submission_id, r.body])));
      setState("ready");
    })();
  }, [router]);

  const isDone = useCallback(
    (id: string) => criteria.length > 0 && criteria.every((c) => scores[id]?.[c.id] !== undefined),
    [criteria, scores],
  );

  const visible = useMemo(
    () => subs.filter((s) => (!sdgFilter || s.sdg === sdgFilter) && (!pendingOnly || !isDone(s.id))),
    [subs, sdgFilter, pendingOnly, isDone],
  );
  const sub = subs.find((s) => s.id === selected) ?? null;
  const doneCount = subs.filter((s) => isDone(s.id)).length;

  function pick(id: string) {
    if (id === selected) return; // re-clicking the open entry would clear the deck without refetching
    setSelected(id);
    setDraft({ ...(scores[id] ?? {}) });
    setNote(comments[id] ?? "");
    setMsg("");
    setPdfUrl(null);
  }

  useEffect(() => {
    if (!selected) return;
    const path = subs.find((s) => s.id === selected)?.deck_path;
    if (!path) return;
    let live = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const r = await fetch(`/api/deck-url?path=${encodeURIComponent(path)}`, { headers: { Authorization: `Bearer ${session?.access_token}` } });
      const j = r.ok ? await r.json() : null;
      if (live) setPdfUrl(j?.url ?? null);
    });
    return () => { live = false; };
  }, [selected, subs]);

  const pct = useMemo(() => {
    const filled = criteria.filter((c) => draft[c.id] !== undefined);
    if (!filled.length) return null;
    const w = criteria.reduce((a, c) => a + c.weight, 0);
    return Math.round((filled.reduce((a, c) => a + (draft[c.id] / c.max_score) * c.weight, 0) / w) * 100);
  }, [draft, criteria]);

  async function save() {
    if (!sub || !judge) return;
    setSaving(true);
    setMsg("");
    const rows = criteria
      .filter((c) => draft[c.id] !== undefined)
      .map((c) => ({ judge_id: judge.user_id, submission_id: sub.id, criterion_id: c.id, value: draft[c.id] }));
    const r1 = rows.length ? await supabase.from("scores").upsert(rows) : { error: null };
    const r2 = await supabase.from("comments").upsert({ judge_id: judge.user_id, submission_id: sub.id, body: note, updated_at: new Date().toISOString() });
    setSaving(false);
    if (r1.error || r2.error) return setMsg((r1.error ?? r2.error)!.message);
    setScores((p) => ({ ...p, [sub.id]: { ...draft } }));
    setComments((p) => ({ ...p, [sub.id]: note }));
    setMsg("Saved.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (state === "loading") return <div className="empty">Loading…</div>;
  if (state === "denied")
    return (
      <div className="empty">
        <div>
          <h1 style={{ fontSize: 56 }}>Awaiting <em style={{ color: "var(--yellow)" }}>approval</em></h1>
          <p style={{ margin: "14px 0 24px", color: "var(--mute)" }}>You&apos;re signed in, but an organiser hasn&apos;t approved your judge access yet.</p>
          <button className="btn ghost" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );

  const color = sub ? SDG_COLORS[sub.sdg] : "#151515";
  return (
    <div className="desk">
      <aside className="col">
        <div className="brandrow"><span className="brand" style={{ fontSize: 16 }}><Logo />Hack for SDG</span><span className="label">{judge?.name}</span></div>
        <div className="top">
          <p className="label">Your progress</p>
          <h1>{doneCount}<em>/{subs.length}</em> scored</h1>
          <div className="progress"><i style={{ width: `${subs.length ? (doneCount / subs.length) * 100 : 0}%` }} /></div>
          <div className="filters">
            <select aria-label="Filter by SDG" value={sdgFilter} onChange={(e) => setSdgFilter(+e.target.value)}>
              <option value={0}>All goals</option>
              {Object.entries(SDG_NAMES).map(([n, name]) => <option key={n} value={n}>{n}. {name}</option>)}
            </select>
            <button className="chipbtn" aria-pressed={pendingOnly} onClick={() => setPendingOnly((v) => !v)}>Unscored</button>
          </div>
        </div>
        {visible.map((s, i) => (
          <button key={s.id} className="card rise" style={{ ["--c" as string]: SDG_COLORS[s.sdg], animationDelay: `${Math.min(i, 12) * 30}ms` }} aria-current={s.id === selected} onClick={() => pick(s.id)}>
            <div className="meta"><span>SDG {s.sdg}</span>{isDone(s.id) && <span className="done">✓ Scored</span>}</div>
            <h3>Entry {String(s.number).padStart(3, "0")}</h3>
            <div className="t">{s.title}</div>
          </button>
        ))}
        {!visible.length && <p className="empty" style={{ height: 160 }}>{subs.length ? "Nothing matches." : "No submissions yet."}</p>}
      </aside>

      <section className="stage" style={{ ["--c" as string]: color, ["--fg-on" as string]: onColor(color) }}>
        {sub ? (
          <>
            <div className="stage-head">
              <span className="chip">SDG {sub.sdg} · {SDG_NAMES[sub.sdg]}</span>
              <h2>Entry {String(sub.number).padStart(3, "0")}</h2>
              <p><strong>{sub.title}</strong></p>
              {sub.summary && <p style={{ color: "var(--mute)", marginTop: 4 }}>{sub.summary}</p>}
            </div>
            {pdfUrl ? <iframe src={pdfUrl} title={`Entry ${sub.number} deck`} /> : <div className="empty">Loading deck…</div>}
          </>
        ) : <div className="empty">Pick a team on the left to start judging.</div>}
      </section>

      <aside className="panel" style={{ ["--c" as string]: color, ["--fg-on" as string]: onColor(color) }}>
        <div className="bar">
          {judge?.is_admin ? <Link href="/judge/leaderboard">Leaderboard →</Link> : <span />}
          <button className="link" onClick={signOut}>Sign out</button>
        </div>
        {sub ? (
          <div className="panel-body">
            <div>
              <p className="label">Your score</p>
              <div className="total">{pct ?? "–"}{pct !== null && <small>%</small>}</div>
              <div className="meter"><i style={{ width: `${pct ?? 0}%` }} /></div>
            </div>
            {criteria.map((c) => (
              <div className="crit" key={c.id}>
                <p className="crit-label">{c.label}{c.weight !== 1 && ` · ×${c.weight}`}</p>
                <div className="row" role="group" aria-label={c.label}>
                  {Array.from({ length: c.max_score + 1 }, (_, v) => (
                    <button key={v} className="pip" aria-pressed={draft[c.id] === v} onClick={() => setDraft((d) => ({ ...d, [c.id]: v }))}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <label className="label" htmlFor="note">Notes</label>
              <textarea id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} style={{ marginTop: 8 }} />
            </div>
            <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save scores"}</button>
            {msg && <p role="status" className="sum" style={{ color: msg === "Saved." ? "var(--ok)" : "var(--red)" }}>{msg}</p>}
          </div>
        ) : <div className="empty">Scores appear here.</div>}
      </aside>
    </div>
  );
}
