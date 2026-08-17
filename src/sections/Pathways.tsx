import { ASSETS, PATHWAYS, CATEGORY_COLORS } from '../data/assets';

export default function Pathways() {
  const byId = Object.fromEntries(ASSETS.map((a) => [a.id, a]));
  const orbit = ASSETS.filter((a) => a.lat === undefined);

  const walk = (id: string) => {
    window.dispatchEvent(new CustomEvent('bw:trail', { detail: id }));
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="paths" className="relative bg-[#12141f] py-20 md:py-28 border-t border-[rgba(251,250,245,0.1)]">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14 reveal">
          <div>
            <div className="font-mono2 text-[11px] tracking-[0.22em] text-[#d52b1e] mb-4">03 / THE PATHWAYS</div>
            <h2 className="font-display uppercase text-5xl md:text-7xl leading-[0.95]">
              Walk in like<br />a local.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#fbfaf5]/70">
            The ecosystem isn't a list — it's a set of routes. Curated trails that chain the rooms,
            tools and people into one afternoon, one skill, or one first prototype.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {PATHWAYS.map((p, pi) => (
            <div
              key={p.id}
              className="reveal ticket group border border-[rgba(251,250,245,0.14)] bg-[#12141f] flex flex-col hover:border-[rgba(251,250,245,0.4)] transition-colors duration-300"
            >
              {/* ticket stub header */}
              <div className="flex items-center justify-between px-6 md:px-8 pt-6 pb-4 border-b border-dashed border-[rgba(251,250,245,0.18)]">
                <span className="font-mono2 text-[10px] tracking-[0.2em] text-[#fbfaf5]/55">
                  TRAIL P{String(pi + 1)} · {p.stops.length} STOPS
                </span>
                <span className="font-mono2 text-[10px] tracking-[0.2em] text-[#d52b1e]">BW·BC</span>
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <h3 className="font-display uppercase text-2xl md:text-3xl tracking-wide leading-tight">
                  {p.name}
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[#fbfaf5]/70">{p.blurb}</p>

                {/* route diagram */}
                <ol className="mt-6 flex-1 relative">
                  <span aria-hidden className="absolute left-[9px] top-2 bottom-2 w-px bg-[rgba(213,43,30,0.4)]" />
                  {p.stops.map((sid, si) => {
                    const a = byId[sid];
                    if (!a) return null;
                    return (
                      <li key={sid} className="flex items-baseline gap-4 py-1.5 relative">
                        <span
                          className="relative z-10 block w-[19px] h-[19px] rounded-full border-2 border-[#d52b1e] bg-[#12141f] shrink-0 text-center font-mono2 text-[9px] leading-[15px] text-[#fbfaf5]/70"
                        >
                          {si + 1}
                        </span>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-[#fbfaf5]/85 hover:text-[#cedc00] transition-colors"
                        >
                          {a.name}
                        </a>
                        <span className="hidden md:inline font-mono2 text-[9.5px] tracking-[0.06em] text-[#fbfaf5]/40 uppercase truncate">
                          {a.location}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <button
                  onClick={() => walk(p.id)}
                  className="mt-7 self-start font-mono2 text-[10.5px] tracking-[0.18em] border border-[#d52b1e] text-[#d52b1e] px-5 py-2.5 hover:bg-[#d52b1e] hover:text-[#fbfaf5] transition-colors"
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
              The Orbit<span className="text-[#84bd00]">.</span>
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-[#fbfaf5]/60">
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
                className="reveal ticket group border border-[rgba(251,250,245,0.14)] hover:border-[#84bd00] transition-colors duration-300 flex flex-col"
              >
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-dashed border-[rgba(251,250,245,0.18)]">
                  <span
                    className="font-mono2 text-[9px] tracking-[0.16em] uppercase"
                    style={{ color: CATEGORY_COLORS[a.category] }}
                  >
                    {a.category}
                  </span>
                  <span className="font-mono2 text-[10px] text-[#fbfaf5]/40 group-hover:text-[#cedc00] transition-colors">↗</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="font-display uppercase text-xl tracking-wide leading-tight">{a.name}</div>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#fbfaf5]/60 flex-1">{a.blurb}</p>
                  <div className="mt-4 pt-3 border-t border-[rgba(251,250,245,0.08)] font-mono2 text-[9.5px] tracking-[0.12em] text-[#84bd00] uppercase">
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
