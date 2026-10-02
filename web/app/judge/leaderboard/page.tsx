"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SDG_COLORS } from "@/lib/sdg";
import AppBar, { Stripe } from "../../appbar";

type Row = { submission_id: string; number: number; team_name: string; title: string; sdg: number; judges_scored: number; score_pct: number | null };

const FINALISTS = 10;

export default function Leaderboard() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace("/login");
      const { data, error } = await supabase.rpc("leaderboard");
      if (error) return setErr(error.message);
      setRows((data ?? []) as Row[]);
    })();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppBar><a href="/judge" className="label">← Judging desk</a></AppBar>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "56px 28px 96px" }}>
        <p className="label">Admin only</p>
        <h1 className="rise" style={{ fontSize: "clamp(56px, 10vw, 128px)", margin: "10px 0 16px" }}>
          Leader<em style={{ color: "var(--yellow)" }}>board.</em>
        </h1>
        <p style={{ color: "var(--mute)", marginBottom: 48, maxWidth: "52ch" }}>
          Each judge&apos;s weighted score, averaged across judges. The top {FINALISTS} go to the final round.
        </p>
        {err && <p role="alert" style={{ color: "var(--red)" }}>{err}</p>}
        {rows && !rows.length && !err && <p style={{ color: "var(--mute)" }}>No admin access, or no submissions yet.</p>}
        <ol style={{ listStyle: "none" }}>
          {rows?.map((r, i) => {
            const c = SDG_COLORS[r.sdg];
            const scored = r.score_pct !== null;
            const top = scored && i < FINALISTS;
            return (
              <li key={r.submission_id} className="rise lb-row" style={{ ["--c" as string]: c, animationDelay: `${Math.min(i, 15) * 45}ms`, opacity: top || !scored ? (scored ? 1 : 0.5) : 0.62, borderTop: i === FINALISTS ? "2px dashed var(--yellow)" : "1px solid var(--line)" }}>
                <span className="lb-rank" style={{ color: top ? "var(--yellow)" : "var(--mute)" }}>{scored ? String(i + 1).padStart(2, "0") : "–"}</span>
                <div className="lb-main">
                  <h2>{r.team_name}</h2>
                  <p className="label">Entry {String(r.number).padStart(3, "0")} · SDG {r.sdg} · {r.title} · {r.judges_scored} judge{r.judges_scored === 1 ? "" : "s"}</p>
                  <div className="lb-bar"><i style={{ width: `${r.score_pct ?? 0}%` }} /></div>
                </div>
                <span className="lb-score">{r.score_pct ?? "–"}{r.score_pct !== null && <small>%</small>}</span>
              </li>
            );
          })}
        </ol>
      </main>
      <Stripe />
      <style>{`
        .lb-row { display: grid; grid-template-columns: 72px 1fr auto; gap: 20px; align-items: center; padding: 22px 0; }
        .lb-rank { font-size: 44px; font-weight: 700; letter-spacing: -0.06em; }
        .lb-main h2 { font-size: 30px; margin-bottom: 6px; letter-spacing: -0.03em; }
        .lb-bar { height: 5px; background: var(--surface-2); border-radius: 5px; margin-top: 12px; overflow: hidden; }
        .lb-bar i { display: block; height: 100%; background: var(--c); }
        .lb-score { font-size: 48px; font-weight: 700; letter-spacing: -0.05em; }
        .lb-score small { font-size: 20px; color: var(--mute); }
        @media (max-width: 600px) { .lb-row { grid-template-columns: 48px 1fr; } .lb-score { grid-column: 2; font-size: 32px; } .lb-rank { font-size: 32px; } }
      `}</style>
    </div>
  );
}
