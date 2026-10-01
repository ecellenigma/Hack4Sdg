import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "12vh 24px" }}>
      <p className="label">AIESEC × E-Cell Enigma</p>
      <h1 style={{ fontSize: "clamp(48px, 9vw, 96px)", margin: "12px 0 24px" }}>Hack for SDG</h1>
      <p style={{ marginBottom: 32 }}>Homepage coming soon. Judges, head to the desk.</p>
      <Link className="btn" href="/judge" style={{ textDecoration: "none", display: "inline-block" }}>Judging desk →</Link>
    </main>
  );
}
