import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SDG_COLORS, onColor } from "@/lib/sdg";

const LOGO = `data:image/png;base64,${readFileSync(join(process.cwd(), "public/hack4sdg.png")).toString("base64")}`;

export const alt = "Hack for SDG, the Global Goals Hackathon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b0b0a", color: "#f4f1e8", padding: 64 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: "#9a968a" }}>AIESEC × E-CELL ENIGMA · THE GLOBAL GOALS HACKATHON</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} width={188} height={135} alt="" style={{ borderRadius: 12 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 124, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>
          <div style={{ display: "flex" }}>Hack for SDG</div>
          <div style={{ display: "flex", fontSize: 54, letterSpacing: -2, color: "#FCC30B", marginTop: 20 }}>Eighteen goals. One idea of yours.</div>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 0, fontWeight: 500, color: "#9a968a", marginTop: 26 }}>Submit by 10 October · Offline finals 17 October</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(SDG_COLORS).map(([n, c]) => (
            <div key={n} style={{ width: 54, height: 54, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: c, color: onColor(c), fontSize: 22, fontWeight: 700, border: n === "18" ? "1px solid #444" : "none" }}>
              {n === "18" ? "+" : n}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
