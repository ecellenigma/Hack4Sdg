import Link from "next/link";
import { SDG_COLORS } from "@/lib/sdg";

const NINE = Object.values(SDG_COLORS).slice(0, 9);

export function Logo() {
  return <span className="logo" aria-hidden>{NINE.map((c) => <i key={c} style={{ background: c }} />)}</span>;
}

export function Stripe() {
  return <div className="stripe" aria-hidden>{Object.values(SDG_COLORS).slice(0, 17).map((c) => <i key={c} style={{ background: c }} />)}</div>;
}

export default function AppBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="appbar">
      <Link href="/" className="brand"><Logo />Hack for SDG</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>{children}</div>
    </header>
  );
}
