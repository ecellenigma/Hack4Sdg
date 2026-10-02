"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PROBLEMS } from "@/lib/problems";
import { SDG_COLORS, SDG_NAMES, onColor } from "@/lib/sdg";

export default function GoalExplorer() {
  const [n, setN] = useState(1);

  useEffect(() => {
    const h = (e: Event) => setN((e as CustomEvent<number>).detail);
    window.addEventListener("pick-goal", h);
    return () => window.removeEventListener("pick-goal", h);
  }, []);

  const color = SDG_COLORS[n];
  const fg = onColor(color);
  return (
    <div className="explorer">
      <div className="exp-list" role="tablist" aria-label="Goals">
        {Object.keys(SDG_COLORS).map((k) => {
          const g = +k;
          return (
            <button key={g} role="tab" aria-selected={g === n} onClick={() => setN(g)}
              style={{ ["--c" as string]: SDG_COLORS[g], ["--on" as string]: onColor(SDG_COLORS[g]) }}>
              <b>{String(g).padStart(2, "0")}</b>
              <span>{g === 18 ? "Student innovation" : SDG_NAMES[g]}</span>
            </button>
          );
        })}
      </div>
      <div className="exp-panel" role="tabpanel" style={{ background: color, color: fg }} key={n}>
        <div className="exp-in">
          <span className="exp-num" aria-hidden>{n === 18 ? "+" : n}</span>
          <p className="exp-kicker">{n === 18 ? "Your own idea" : `Goal ${n}`}</p>
          <h3>{n === 18 ? "Student innovation" : SDG_NAMES[n]}</h3>
          <p className="exp-text">{PROBLEMS[n]}</p>
          <Link href={`/submit?sdg=${n}`} className="exp-cta" style={{ borderColor: fg }}>Pitch for this goal →</Link>
        </div>
      </div>
    </div>
  );
}
