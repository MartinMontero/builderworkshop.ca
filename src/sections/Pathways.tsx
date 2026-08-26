import { ASSETS, PATHWAYS, CATEGORY_COLORS, STACK } from '../data/assets';

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
        {/* The Stack — how to use this site with friends & collaborators.
            Its own anchor: it shares a <section> with the pathways, so #paths
            alone cannot distinguish them and the nav would land both links
            in the same place. */}
        <div id="stack" className="scroll-anchor">
        <div className="mb-16 reveal">
          <div className="eyebrow mb-4">HOW TO USE THIS</div>
          <h3 className="font-display uppercase text-3xl md:text-5xl leading-[0.95] max-w-3xl">
            The builder's stack<span className="text-[var(--accent)]">.</span>
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
                        <span className="font-mono2 text-[8.5px] tracking-[0.14em] bg-[var(--brand)] text-[var(--brand-ink)] px-1.5 py-0.5">THIS SITE</span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink)]/55">{it.note}</p>
                    </div>
                  ))}
                  {s.partners.map((pt) => (
                    <a key={pt.name} href={pt.url} target="_blank" rel="noreferrer" className="group/p block">
                      <div className="flex items-center gap-2">
                        <span className="font-display uppercase text-base tracking-wide group-hover/p:text-[var(--accent)] transition-colors">
                          {pt.name} ↗
                        </span>
                        <span className="font-mono2 text-[8.5px] tracking-[0.14em] border border-[var(--line-strong)] text-[var(--ink-soft)] px-1.5 py-0.5">FRIEND</span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink)]/55">{pt.note}</p>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        </div>

        {/* The anchor sits on a plain wrapper, not on the .reveal element.
            A reveal animates translateY after the scroll has settled, which
            drags the target back under the fixed nav by ~28px. #stack works
            because its anchor is likewise on a non-animated wrapper. */}
        <div id="pathways" className="scroll-anchor">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14 reveal">
          <div>
            <div className="eyebrow mb-4">PATHWAYS</div>
            <h2 className="font-display uppercase text-5xl md:text-7xl leading-[0.95]">
              Walk in like<br />you belong.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ink)]/70">
            The ecosystem isn't a list — it's a set of routes. Curated trails that chain the rooms,
            tools and people into one afternoon, one skill, or one first prototype.
          </p>
        </div>

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
                <span className="font-mono2 text-[10px] tracking-[0.2em] text-[var(--accent)]">BW·BC</span>
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <h3 className="font-display uppercase text-2xl md:text-3xl tracking-wide leading-tight">
                  {p.name}
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink)]/70">{p.blurb}</p>
                <p className="mt-3 font-mono2 text-[10px] tracking-[0.08em] text-[var(--accent)] leading-relaxed">
                  FIRST MOVE: walk in, say what you're making, ask who's around. These rooms expect it.
                </p>

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
                          className="text-sm text-[var(--ink)]/85 hover:text-[var(--accent)] transition-colors"
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
                  className="mt-7 self-start font-mono2 text-[10.5px] tracking-[0.18em] border border-[var(--accent)] text-[var(--accent)] px-5 py-2.5 hover:bg-[var(--brand)] hover:text-[var(--brand-ink)] transition-colors"
                >
                  See it on the map ↑
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* The Orbit — players with no fixed venue */}
        <div className="mt-20 reveal">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <h3 className="font-display uppercase text-3xl md:text-5xl leading-[0.95]">
              The Orbit<span className="text-[var(--accent)]">.</span>
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
                className="reveal ticket group border border-[var(--line)] hover:border-[var(--line-strong)] transition-colors duration-300 flex flex-col"
              >
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-dashed border-[var(--line)]">
                  <span
                    className="font-mono2 text-[9px] tracking-[0.16em] uppercase"
                    style={{ color: CATEGORY_COLORS[a.category] }}
                  >
                    {a.category}
                  </span>
                  <span className="font-mono2 text-[10px] text-[var(--ink)]/40 group-hover:text-[var(--accent)] transition-colors">↗</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="font-display uppercase text-xl tracking-wide leading-tight">{a.name}</div>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--ink)]/60 flex-1">{a.blurb}</p>
                  <div className="mt-4 pt-3 border-t border-[var(--line)] font-mono2 text-[9.5px] tracking-[0.12em] text-[var(--accent)] uppercase">
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
