import { ASSETS, PATHWAYS } from '../data/assets';

export default function Pathways() {
  const byId = Object.fromEntries(ASSETS.map((a) => [a.id, a]));

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
          <p className="max-w-sm text-sm leading-relaxed text-[#fbfaf5]/60">
            The ecosystem isn't a list — it's a set of routes. Curated trails that chain the rooms,
            tools and people into one afternoon, one skill, or one first prototype.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {PATHWAYS.map((p, pi) => (
            <div
              key={p.id}
              className="reveal group border border-[rgba(251,250,245,0.14)] p-6 md:p-8 flex flex-col hover:border-[rgba(251,250,245,0.4)] transition-colors duration-300"
            >
              <div className="font-mono2 text-[10px] tracking-[0.2em] text-[#fbfaf5]/40 mb-4">
                P{String(pi + 1)} · {p.stops.length} STOPS
              </div>
              <h3 className="font-display uppercase text-2xl md:text-3xl tracking-wide leading-tight">
                {p.name}
              </h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#fbfaf5]/60">{p.blurb}</p>

              <ol className="mt-6 space-y-2.5 flex-1">
                {p.stops.map((sid, si) => {
                  const a = byId[sid];
                  if (!a) return null;
                  return (
                    <li key={sid} className="flex items-baseline gap-3">
                      <span className="font-mono2 text-[10px] text-[#d52b1e] shrink-0 w-5">
                        {String(si + 1).padStart(2, '0')}
                      </span>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#fbfaf5]/80 hover:text-[#cedc00] transition-colors"
                      >
                        {a.name}
                      </a>
                      <span className="hidden md:inline font-mono2 text-[9.5px] tracking-[0.06em] text-[#fbfaf5]/35 uppercase truncate">
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
          ))}
        </div>
      </div>
    </section>
  );
}
