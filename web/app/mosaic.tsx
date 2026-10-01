"use client";
import { SDG_COLORS, SDG_NAMES, onColor } from "@/lib/sdg";

export default function Mosaic() {
  return (
    <ul className="mosaic" aria-label="The 18 goals">
      {Object.keys(SDG_COLORS).map((k, i) => {
        const n = +k;
        return (
          <li key={n} style={{ ["--i" as string]: i }}>
            <a
              href="#goals"
              title={SDG_NAMES[n]}
              aria-label={`Goal ${n}: ${SDG_NAMES[n]}`}
              style={{ background: SDG_COLORS[n], color: onColor(SDG_COLORS[n]) }}
              onClick={() => window.dispatchEvent(new CustomEvent("pick-goal", { detail: n }))}
            >
              <span>{n === 18 ? "+" : n}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
