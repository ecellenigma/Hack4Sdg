import Link from "next/link";
import { PROBLEMS } from "@/lib/problems";
import { SDG_COLORS, SDG_NAMES } from "@/lib/sdg";
import "./home.css";

const STEPS = [
  ["01", "Form your team", "Up to 4 members."],
  ["02", "Identify & innovate", "Pick a problem statement aligned with an SDG and come up with a solution."],
  ["03", "Build your idea", "Make a presentation of your project and a way forward for its implementation."],
  ["04", "Pitch it", "Present for 7–8 minutes."],
  ["05", "Zero fees", "No registration fee for the prelims."],
  ["06", "Make the finals", "The 5 best teams from the college go to the final round."],
];

const CRITERIA = [
  "SDG Relevance & Problem Identification",
  "Innovation & Originality",
  "Social & Environmental Impact",
  "Feasibility & Scalability",
  "Sustainability & Viability",
];

export default function Home() {
  return (
    <main className="home">
      <header className="hero">
        <p className="label rise">AIESEC × E-Cell Enigma · Prelims</p>
        <h1 className="rise" style={{ animationDelay: "80ms" }}>
          Hack <em>for</em> SDG
        </h1>
        <p className="lede rise" style={{ animationDelay: "160ms" }}>
          The Global Goals Hackathon. Find a real-world problem tied to the UN Sustainable Development Goals, and pitch a
          solution that can create meaningful social impact.
        </p>
        <div className="cta rise" style={{ animationDelay: "240ms" }}>
          <Link className="btn" href="/submit">Submit your idea →</Link>
          <a className="btn ghost" href="#goals">See the problems</a>
        </div>
        <div className="stripe" aria-hidden>
          {Object.entries(SDG_COLORS).slice(0, 17).map(([n, c]) => <span key={n} style={{ background: c }} />)}
        </div>
      </header>

      <section id="goals">
        <h2>Pick a goal. Or bring your own.</h2>
        <div className="grid">
          {Object.entries(PROBLEMS).map(([n, text], i) => (
            <article key={n} className="tile rise" style={{ ["--c" as string]: SDG_COLORS[+n], animationDelay: `${i * 25}ms` }}>
              <span className="num">{n}</span>
              <h3>{+n === 18 ? "Student innovation" : SDG_NAMES[+n]}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>How it works</h2>
        <ol className="steps">
          {STEPS.map(([n, t, d]) => (
            <li key={n}><span className="label">{n}</span><h3>{t}</h3><p>{d}</p></li>
          ))}
        </ol>
      </section>

      <section className="judging">
        <h2>How you&apos;re judged</h2>
        <p>Judging is blind. Judges see only your presentation, never team names or colleges. Keep names and logos off your slides.</p>
        <ul>{CRITERIA.map((c, i) => <li key={c}><span>{i + 1}</span>{c}</li>)}</ul>
      </section>

      <footer className="foot">
        <Link className="btn" href="/submit">Submit your idea →</Link>
        <Link href="/judge" className="label">Judges: sign in</Link>
      </footer>
    </main>
  );
}
