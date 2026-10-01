"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SDG_COLORS } from "@/lib/sdg";

type Row = { submission_id: string; number: number; team_name: string; title: string; sdg: number; judges_scored: number; score_pct: number | null };

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
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px" }}>
      <Link href="/judge" className="label">← Judging desk</Link>
      <h1 style={{ fontSize: "clamp(40px, 7vw, 72px)", margin: "8px 0 8px" }}>Leaderboard</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 32 }}>Weighted score per judge, averaged across judges. Top 5 advance to the final round.</p>
      {err && <p role="alert" style={{ color: "var(--accent)" }}>{err}</p>}
      {rows && !rows.length && !err && <p>No admin access, or no submissions yet.</p>}
      <ol style={{ listStyle: "none" }}>
        {rows?.map((r, i) => (
          <li key={r.submission_id} className="rise" style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", alignItems: "center", gap: 16, padding: "14px 0", borderTop: i === 5 ? "4px double var(--accent)" : "1px solid var(--ink)", animationDelay: `${Math.min(i, 15) * 40}ms`, opacity: i < 5 ? 1 : 0.7 }}>
            <span style={{ fontFamily: "var(--display)", fontSize: 40 }}>{i + 1}</span>
            <div style={{ borderLeft: `8px solid ${SDG_COLORS[r.sdg]}`, paddingLeft: 12 }}>
              <h2 style={{ fontSize: 24 }}>{r.team_name}</h2>
              <p className="label">Entry {String(r.number).padStart(3, "0")} · SDG {r.sdg} · {r.title} · {r.judges_scored} judge{r.judges_scored === 1 ? "" : "s"}</p>
            </div>
            <span style={{ fontFamily: "var(--display)", fontSize: 32 }}>{r.score_pct ?? "–"}{r.score_pct !== null && "%"}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
