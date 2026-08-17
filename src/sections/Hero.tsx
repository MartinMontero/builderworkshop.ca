import { ASSETS, PATHWAYS } from '../data/assets';

const INTENTS = [
  {
    id: 'idea',
    label: 'I have an idea',
    q: 'Back it early.',
    body: 'Programs that take you at the napkin stage — pre-seed incubators, accelerators, founder communities.',
    target: '#players',
    filter: 'Programs & Accelerators',
  },
  {
    id: 'make',
    label: 'I need to make something',
    q: 'Get your hands on tools.',
    body: 'Makerspaces, fabrication shops, studios and tool libraries — filter the map by the exact machine you need.',
    target: '#map',
    filter: null,
  },
  {
    id: 'learn',
    label: 'I want to learn',
    q: 'Level up.',
    body: 'Schools, STEAM academies, grad programs and free public labs across BC.',
    target: '#players',
    filter: 'Learning & Talent',
  },
  {
    id: 'people',
    label: "I'm looking for my people",
    q: 'Find the room.',
    body: 'Communities, meetups and the physical third-places where builders actually collide — start with a pathway.',
    target: '#paths',
    filter: null,
  },
  {
    id: 'fund',
    label: 'I need funding',
    q: 'Fuel the build.',
    body: 'Capital, loans and venture builders — plus the funding tools our friends run.',
    target: '#players',
    filter: 'Capital & Venture',
  },
];

export default function Hero() {
  const go = (target: string) => {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="top" className="relative bg-[var(--bg)] pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        <div className="font-mono2 text-[11px] tracking-[0.22em] text-[var(--accent)] mb-6 reveal">
          LOWER MAINLAND · BRITISH COLUMBIA — {ASSETS.length} PLAYERS · 4 PATHWAYS
        </div>

        <h1 className="font-display uppercase leading-[0.92] text-[12vw] md:text-[7.5vw] max-w-5xl reveal">
          What are you<br />
          <span className="text-[var(--accent)]">building?</span>
        </h1>

        <p className="mt-6 max-w-xl text-[15px] md:text-lg leading-relaxed text-[var(--ink-soft)] reveal">
          This isn't a directory to scroll — it's the shortest path from where you are to a room,
          a tool, and a person who can help. Pick where you're at.
        </p>

        {/* intent router */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[var(--line)] border border-[var(--line)] reveal">
          {INTENTS.map((it) => (
            <button
              key={it.id}
              onClick={() => go(it.target)}
              className="group bg-[var(--bg)] hover:bg-[var(--bg-raise)] text-left p-5 md:p-6 transition-colors flex flex-col gap-3"
            >
              <span className="font-mono2 text-[9.5px] tracking-[0.18em] text-[var(--accent)] uppercase">
                {it.q}
              </span>
              <span className="font-display uppercase text-xl md:text-2xl leading-tight tracking-wide group-hover:text-[var(--accent)] transition-colors">
                {it.label}
              </span>
              <span className="text-[12px] leading-relaxed text-[var(--ink-soft)]">{it.body}</span>
              <span className="mt-auto font-mono2 text-[11px] text-[var(--ink-faint)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all">
                →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 font-mono2 text-[10px] tracking-[0.16em] text-[var(--ink-faint)] reveal">
          <span>{ASSETS.length} ECOSYSTEM PLAYERS</span>
          <span>27 VENUES ON THE MAP</span>
          <span>{PATHWAYS.length} CURATED PATHWAYS</span>
          <span>OPEN DATA · CC BY 4.0</span>
        </div>
      </div>
    </section>
  );
}
