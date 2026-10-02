import Link from "next/link";
import GoalExplorer from "./goal-explorer";
import Mosaic from "./mosaic";
import { SDG_COLORS, SDG_NAMES } from "@/lib/sdg";
import "./home.css";

const STEPS = [
  ["Form your team", "Up to four people. Mix skills, not just friends."],
  ["Pick a problem", "Choose a goal's problem statement, or bring your own under Student Innovation."],
  ["Build the idea", "A presentation of your solution and a realistic way forward to implement it."],
  ["Submit the deck", "Upload one PDF by 10 October. It goes to the judges without your names on it."],
  ["Get scored", "Judges rate every deck on five criteria. Zero registration fee."],
  ["Reach the finals", "The ten best teams go on to the offline final round on 17 October and pitch for 7–8 minutes."],
];

const CRITERIA = [
  "SDG Relevance & Problem Identification",
  "Innovation & Originality",
  "Social & Environmental Impact",
  "Feasibility & Scalability",
  "Sustainability & Viability",
];

const NAMES = Object.values(SDG_NAMES).slice(0, 17);
const COLORS = Object.values(SDG_COLORS);

export default function Home() {
  return (
    <div className="h">
      <nav className="nav">
        <Link href="/" className="brand" aria-label="Hack for SDG">
          <span className="logo" aria-hidden>{COLORS.slice(0, 9).map((c) => <i key={c} style={{ background: c }} />)}</span>
          Hack for SDG
        </Link>
        <div className="nav-links">
          <a href="#goals">Goals</a>
          <a href="#journey">Journey</a>
          <a href="#judging">Judging</a>
          <Link href="/submit" className="pill">Submit idea</Link>
        </div>
      </nav>

      <header className="hero">
        <p className="eyebrow">AIESEC × E-Cell Enigma · The Global Goals Hackathon</p>
        <h1>
          <span>Eighteen goals.</span>
          <span>One idea <em>of yours.</em></span>
        </h1>
        <p className="sub">
          Hack for SDG is an ideathon for college students. Pick a real-world problem tied to the UN&apos;s Sustainable
          Development Goals and pitch a solution that makes a difference.
        </p>
        <p className="dates">
          <span><b>10 Oct</b> Round 1 submissions close</span>
          <span><b>17 Oct</b> Offline final round</span>
        </p>
        <div className="hero-cta">
          <Link href="/submit" className="big">Submit your idea <span aria-hidden>→</span></Link>
          <a href="#goals" className="link">Browse the problems ↓</a>
        </div>
        <Mosaic />
        <dl className="facts">
          <div><dt>0</dt><dd>registration fee</dd></div>
          <div><dt>4</dt><dd>members per team</dd></div>
          <div><dt>7–8</dt><dd>minute pitch</dd></div>
          <div><dt>10</dt><dd>teams reach the finals</dd></div>
        </dl>
      </header>

      <div className="marquee" aria-hidden>
        <div>
          {[...NAMES, ...NAMES].map((t, i) => (
            <span key={i}><i style={{ background: COLORS[i % 17] }} />{t}</span>
          ))}
        </div>
      </div>

      <section id="goals" className="goals">
        <div className="wrap">
          <p className="kicker">The problems</p>
          <h2>Pick a goal. <em>Or bring your own.</em></h2>
          <GoalExplorer />
        </div>
      </section>

      <section id="journey" className="journey">
        <div className="wrap">
          <p className="kicker">The journey</p>
          <h2>From a hunch to the <em>final round.</em></h2>
          <ol>
            {STEPS.map(([t, d], i) => (
              <li key={t} style={{ ["--c" as string]: COLORS[(i * 3) % 17] }}>
                <span className="step-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="judging" className="judging">
        <div className="wrap split">
          <div>
            <p className="kicker">The judging</p>
            <h2>Blind by <em>design.</em></h2>
            <p className="lead">
              Judges see your deck and nothing else: no team name, no college, no faces. Each entry is just a number,
              so the idea is all that gets scored. Keep names and logos off your slides.
            </p>
            <span className="stamp">Anonymous entries</span>
          </div>
          <ol className="crit">
            {CRITERIA.map((c, i) => (
              <li key={c}><b>{i + 1}</b><span>{c}</span><em>/10</em></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="finale">
        <div className="bands" aria-hidden>{COLORS.slice(0, 17).map((c) => <i key={c} style={{ background: c }} />)}</div>
        <div className="wrap">
          <h2>Got an idea worth <em>pitching?</em></h2>
          <Link href="/submit" className="big">Submit your idea <span aria-hidden>→</span></Link>
        </div>
      </section>

      <footer className="foot">
        <span>© Hack for SDG · AIESEC × E-Cell Enigma</span>
        <Link href="/judge">Judges sign in</Link>
      </footer>
    </div>
  );
}
