"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SDG_COLORS, onColor } from "@/lib/sdg";

type Row = { number: number; team_name: string; title: string; sdg: number };

/** Shows nothing until an admin publishes the results from the leaderboard. */
export default function Finalists() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase.rpc("finalists").then(({ data }) => {
      if (data?.length) setRows(data as Row[]);
    });
  }, []);

  if (!rows.length) return null;
  return (
    <section id="finalists" className="finalists">
      <div className="wrap">
        <p className="kicker">The results</p>
        <h2>Through to the <em>finals.</em></h2>
        <ul>
          {rows.map((r) => (
            <li key={r.number}>
              <b style={{ background: SDG_COLORS[r.sdg], color: onColor(SDG_COLORS[r.sdg]) }}>{r.sdg === 18 ? "+" : r.sdg}</b>
              <div>
                <h3>{r.team_name}</h3>
                <p>{r.title}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
