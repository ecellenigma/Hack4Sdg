import Link from "next/link";
import Image from "next/image";
import { BrandBar } from "./appbar";
import GoalExplorer from "./goal-explorer";
import Mosaic from "./mosaic";
import Countdown from "./countdown";
import Finalists from "./finalists";
import { CONTACT, DEADLINE_LABEL, FINALISTS, FINALS_CALENDAR_URL, FINALS_LABEL, PRIZES, VENUE } from "@/lib/event";
import { SDG_COLORS, SDG_NAMES } from "@/lib/sdg";
import "./home.css";

const STEPS = [
  ["Form your team", "Up to four people. Mix skills, not just friends."],
  ["Pick a problem", "Choose a goal's problem statement, or bring your own under Student Innovation."],
  ["Build the idea", "A presentation of your solution and a realistic way forward to implement it."],
  ["Submit the deck", "Upload one PDF by 10 October. It goes to the judges without your names on it."],
  ["Get scored", "Judges rate every deck on five criteria, ten points each."],
  ["Reach the finals", "The ten best teams go on to the offline final round on 17 October and pitch for 7–8 minutes."],
];

const CRITERIA = [
  "SDG Relevance & Problem Identification",
  "Innovation & Originality",
  "Social & Environmental Impact",
  "Feasibility & Scalability",
  "Sustainability & Viability",
];

const FAQ = [
  ["When is the deadline?", `Round 1 submissions close on ${DEADLINE_LABEL}. The form stops accepting decks after that.`],
  ["Is there a fee?", "No. Registration is free."],
  ["How big can a team be?", "Up to four members, and one submission per team."],
  ["Do we have to pick a listed problem?", "No. Each of the 17 goals comes with a problem statement, or you can bring your own idea under Student Innovation."],
  ["What do we submit?", "A single PDF of your presentation, 15 MB or less. If you built it in PowerPoint or Google Slides, export it as a PDF first."],
  ["What should the deck cover?", `Your solution and a realistic way forward to implement it. Judges score five things, ten points each: ${CRITERIA.join("; ")}.`],
  ["Why can't we put our names on the slides?", "Judging is blind. Judges see the deck and an entry number, nothing else, so keep names, college and logos off the slides."],
  ["Can we change our deck after submitting?", "Yes, until the deadline. After you submit you get a private link to your entry page, where you can replace the PDF. Keep that link safe."],
  ["What happens after round 1?", `The ${FINALISTS} best teams go to the offline final round on ${FINALS_LABEL} and pitch for 7–8 minutes. The finalists will be listed on this page.`],
];

const TBA = "To be announced";
const INFO = [
  ["Venue", VENUE || TBA],
  ["Prizes", PRIZES || TBA],
  ["Entry fee", "Free"],
  ["Team size", "Up to 4 members"],
  ...(CONTACT ? [["Contact", CONTACT]] : []),
];

const NAMES = Object.values(SDG_NAMES).slice(0, 17);
const COLORS = Object.values(SDG_COLORS);
const STEP_COLORS = [1, 9, 7, 15, 6, 14].map((n) => SDG_COLORS[n]); // red to blue, one hue per step

export default function Home() {
  return (
    <div className="h">
      <nav className="nav">
        <BrandBar />
        <div className="nav-links">
          <a href="#goals">Goals</a>
          <a href="#journey">Journey</a>
          <a href="#judging">Judging</a>
          <a href="#event">Dates</a>
          <a href="#faq">FAQ</a>
          <Link href="/submit" className="pill">Submit idea</Link>
        </div>
      </nav>

      <header className="hero">
        <div className="lockup">
          <div className="lk-row">
            <div className="lk-grp lk-col">
              <Image src="/nmit.png" alt="NITTE (Deemed to be University)" width={900} height={360} priority />
              <span>Off Campus Centre · Bengaluru</span>
            </div>
            <i className="lk-div" aria-hidden />
            <div className="lk-grp">
              <Image src="/aicte.png" alt="AICTE" width={316} height={316} priority />
              <Image src="/aicte-idea-lab.png" alt="AICTE IDEA Lab" width={509} height={491} priority />
            </div>
            <i className="lk-div" aria-hidden />
            <div className="lk-grp lk-col">
              <Image src="/enigma.png" alt="E-Cell Enigma, Entrepreneurship Cell NMIT" width={302} height={129} priority />
              <span>Supported by</span>
              <strong>Career Development Centre (CDC)</strong>
            </div>
            <i className="lk-div" aria-hidden />
            <div className="lk-grp lk-col">
              <span>In association with</span>
              <div className="lk-grp">
                <Image src="/aiesec.png" alt="AIESEC" width={1265} height={259} priority />
                <Image className="lk-sdg" src="/hack4sdg.png" alt="Hack for SDG" width={282} height={203} priority />
              </div>
            </div>
          </div>
        </div>
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
          <Countdown />
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

      <Finalists />

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
              <li key={t} style={{ ["--c" as string]: STEP_COLORS[i] }}>
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

      <section id="event" className="event">
        <div className="wrap">
          <p className="kicker">The event</p>
          <h2>Two rounds. <em>Two dates.</em></h2>
          <div className="rounds">
            <article>
              <p className="round-tag">Round 1 · Online</p>
              <h3>Until 10 October</h3>
              <p>Submit one PDF deck of your idea on this site. Judges score every deck blind.</p>
              <Link href="/submit">Submit your idea →</Link>
            </article>
            <article>
              <p className="round-tag">Final round · Offline</p>
              <h3>17 October</h3>
              <p>The {FINALISTS} best teams pitch in person for 7–8 minutes.</p>
              <a href={FINALS_CALENDAR_URL} target="_blank" rel="noreferrer">Add to calendar →</a>
            </article>
          </div>
          <dl className="info">
            {INFO.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section id="faq" className="faq">
        <div className="wrap split">
          <div>
            <p className="kicker">The questions</p>
            <h2>Asked <em>often.</em></h2>
          </div>
          <div>
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
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
        <div className="foot-logos">
          <Image src="/aicte.png" alt="AICTE" width={316} height={316} />
          <Image src="/aicte-idea-lab.png" alt="AICTE IDEA Lab" width={509} height={491} />
          <Image src="/enigma-cdc.png" alt="E-Cell Enigma, supported by the Career Development Centre" width={395} height={218} />
          <Image src="/aiesec.png" alt="AIESEC" width={1265} height={259} />
        </div>
        <span>© Hack for SDG · AIESEC × E-Cell Enigma</span>
        <Link href="/judge">Judges sign in</Link>
      </footer>
    </div>
  );
}
