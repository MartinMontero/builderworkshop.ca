import { ASSETS, PATHWAYS, CATEGORY_COLORS } from '../data/assets';

// The builder's stack — the journey, and which tool covers each stage.
const STACK = [
  {
    stage: 'ZERO → ONE',
    color: '#d52b1e',
    items: [
      { name: 'Find a room', here: true, note: 'The asset map + capability filters — where to sit down and start, free or cheap.' },
      { name: 'Walk a trail', here: true, note: 'The pathways — a curated first afternoon, not a blank directory.' },
      { name: 'Learn & meet', here: true, note: 'The directory + The Orbit — schools, communities, programs that back you early.' },
    ],
    partners: [],
  },
  {
    stage: 'ONE → MVP',
    color: '#f0a500',
    items: [],
    partners: [
      { name: 'buildrs.dev', url: 'https://buildrs.dev/', note: 'Every tech event on one calendar, partner drops (Linear, GitHub, Tally), and the product directory to ship into.' },
      { name: 'FoundedIn Canada', url: 'https://foundedincanada.com/', note: 'Funding & grant discovery, the SR&ED estimator, investor-readiness scorecard, name/trademark check.' },
    ],
  },
  {
    stage: 'MVP → SCALE',
    color: 'var(--forest)',
    items: [
      { name: 'Stay & grow here', here: true, note: 'The ecosystem you built in — accelerators, capital, media, and the map that keeps you rooted in BC.' },
    ],
    partners: [
      { name: 'FoundedIn Canada', url: 'https://foundedincanada.com/', note: 'The national intelligence layer — federal programs, ecosystem connections, scaling beyond BC.' },
    ],
  },
];

export default function Pathways() {
  const byId = Object.fromEntries(ASSETS.map((a) => [a.id, a]));
  const orbit = ASSETS.filter((a) => a.lat === undefined);

  const walk = (id: string) => {
    window.dispatchEvent(new CustomEvent('bw:trail', { detail: id }));
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="paths" className="relative bg-[var(--bg-raise)] py-20 md:py-28 border-t border-[var(--line)]">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        {/* The Stack — how to use this site with friends & collaborators */}
        <div className="mb-16 reveal">
          <div className="font-mono2 text-[11px] tracking-[0.22em] text-[var(--forest)] mb-4">HOW TO USE THIS</div>
          <h3 className="font-display uppercase text-3xl md:text-5xl leading-[0.95] max-w-3xl">
            The builder's stack<span className="text-[var(--forest)]">.</span>
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--ink)]/60">
            Three tools, one journey — no overlap, no competition. This site maps the physical
            ecosystem; buildrs.dev and FoundedIn Canada handle events, shipping and the national layer.
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {STACK.map((s) => (
              <div key={s.stage} className="ticket border border-[var(--line)] flex flex-col">
                <div
                  className="px-5 pt-4 pb-3 border-b border-dashed border-[var(--line)] font-mono2 text-[10px] tracking-[0.2em]"
                  style={{ color: s.color }}
                >
                  {s.stage}
                </div>
                <div className="p-5 flex flex-col gap-4 flex-1">
                  {s.items.map((it) => (
                    <div key={it.name}>
                      <div className="flex items-center gap-2">
                        <span className="font-display uppercase text-base tracking-wide">{it.name}</span>
                        <span className="font-mono2 text-[8.5px] tracking-[0.14em] bg-[#d52b1e] text-[var(--ink)] px-1.5 py-0.5">THIS SITE</span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink)]/55">{it.note}</p>
                    </div>
                  ))}
                  {s.partners.map((pt) => (
                    <a key={pt.name} href={pt.url} target="_blank" rel="noreferrer" className="group/p block">
                      <div className="flex items-center gap-2">
                        <span className="font-display uppercase text-base tracking-wide group-hover/p:text-[var(--forest-hi)] transition-colors">
                          {pt.name} ↗
                        </span>
                        <span className="font-mono2 text-[8.5px] tracking-[0.14em] border border-[var(--forest)] text-[var(--forest)] px-1.5 py-0.5">FRIEND</span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink)]/55">{pt.note}</p>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 mb-14 reveal">
          <div>
            <div className="font-mono2 text-[11px] tracking-[0.22em] text-[#d52b1e] mb-4">03 / THE PATHWAYS</div>
            <h2 className="font-display uppercase text-5xl md:text-7xl leading-[0.95]">
              Walk in like<br />a local.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ink)]/70">
            The ecosystem isn't a list — it's a set of routes. Curated trails that chain the rooms,
            tools and people into one afternoon, one skill, or one first prototype.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {PATHWAYS.map((p, pi) => (
            <div
              key={p.id}
              className="reveal ticket group border border-[var(--line)] bg-[var(--bg-raise)] flex flex-col hover:border-[var(--line-strong)] transition-colors duration-300"
            >
              {/* ticket stub header */}
              <div className="flex items-center justify-between px-6 md:px-8 pt-6 pb-4 border-b border-dashed border-[var(--line)]">
                <span className="font-mono2 text-[10px] tracking-[0.2em] text-[var(--ink)]/55">
                  TRAIL P{String(pi + 1)} · {p.stops.length} STOPS
                </span>
                <span className="font-mono2 text-[10px] tracking-[0.2em] text-[#d52b1e]">BW·BC</span>
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <h3 className="font-display uppercase text-2xl md:text-3xl tracking-wide leading-tight">
                  {p.name}
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink)]/70">{p.blurb}</p>

                {/* route diagram */}
                <ol className="mt-6 flex-1 relative">
                  <span aria-hidden className="absolute left-[9px] top-2 bottom-2 w-px bg-[rgba(213,43,30,0.4)]" />
                  {p.stops.map((sid, si) => {
                    const a = byId[sid];
                    if (!a) return null;
                    return (
                      <li key={sid} className="flex items-baseline gap-4 py-1.5 relative">
                        <span
                          className="relative z-10 block w-[19px] h-[19px] rounded-full border-2 border-[#d52b1e] bg-[var(--bg-raise)] shrink-0 text-center font-mono2 text-[9px] leading-[15px] text-[var(--ink)]/70"
                        >
                          {si + 1}
                        </span>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-[var(--ink)]/85 hover:text-[var(--forest-hi)] transition-colors"
                        >
                          {a.name}
                        </a>
                        <span className="hidden md:inline font-mono2 text-[9.5px] tracking-[0.06em] text-[var(--ink)]/40 uppercase truncate">
                          {a.location}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <button
                  onClick={() => walk(p.id)}
                  className="mt-7 self-start font-mono2 text-[10.5px] tracking-[0.18em] border border-[#d52b1e] text-[#d52b1e] px-5 py-2.5 hover:bg-[#d52b1e] hover:text-[var(--ink)] transition-colors"
                >
                  WALK IT ON THE MAP ↑
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* The Orbit — players with no fixed venue */}
        <div className="mt-20 reveal">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <h3 className="font-display uppercase text-3xl md:text-5xl leading-[0.95]">
              The Orbit<span className="text-[var(--forest)]">.</span>
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--ink)]/60">
              No front door, no pin — programs, communities and networks that move around or live online.
              This is how a builder actually plugs into each one.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orbit.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="reveal ticket group border border-[var(--line)] hover:border-[var(--forest)] transition-colors duration-300 flex flex-col"
              >
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-dashed border-[var(--line)]">
                  <span
                    className="font-mono2 text-[9px] tracking-[0.16em] uppercase"
                    style={{ color: CATEGORY_COLORS[a.category] }}
                  >
                    {a.category}
                  </span>
                  <span className="font-mono2 text-[10px] text-[var(--ink)]/40 group-hover:text-[var(--forest-hi)] transition-colors">↗</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="font-display uppercase text-xl tracking-wide leading-tight">{a.name}</div>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--ink)]/60 flex-1">{a.blurb}</p>
                  <div className="mt-4 pt-3 border-t border-[var(--line)] font-mono2 text-[9.5px] tracking-[0.12em] text-[var(--forest)] uppercase">
                    {a.location}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
