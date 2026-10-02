import Image from "next/image";
import Link from "next/link";
import { SDG_COLORS } from "@/lib/sdg";

export function Logo() {
  return <Image src="/hack4sdg.png" alt="" width={282} height={203} priority className="brand-logo" />;
}

export function Stripe() {
  return <div className="stripe" aria-hidden>{Object.values(SDG_COLORS).slice(0, 17).map((c) => <i key={c} style={{ background: c }} />)}</div>;
}

export function BrandBar() {
  return (
    <div className="brandbar">
      <Image src="/enigma.png" alt="E-Cell Enigma" width={302} height={129} priority className="hl hl-enigma" />
      <span className="x" aria-hidden>×</span>
      <Link href="/" className="brand" aria-label="Hack for SDG"><Logo /><span className="sr">Hack for SDG</span></Link>
    </div>
  );
}

export default function AppBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="appbar">
      <BrandBar />
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>{children}</div>
    </header>
  );
}
