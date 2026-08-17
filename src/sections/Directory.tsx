import { ASSETS, CATEGORIES, CATEGORY_COLORS } from '../data/assets';

export default function Directory() {
  let globalIndex = 0;
  return (
    <section id="players" className="relative bg-[#0c0e16] py-20 md:py-28 border-t border-[rgba(251,250,245,0.1)]">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14 reveal">
          <div>
            <div className="font-mono2 text-[11px] tracking-[0.22em] text-[#ff8f0c] mb-4">02 / THE PLAYERS</div>
            <h2 className="font-display uppercase text-5xl md:text-7xl leading-[0.95]">
              Twenty-four<br />ways in.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#fbfaf5]/60">
            Spaces to sit down and build. Programs that back you early. Schools that grow the next
            generation. Communities that show up. People telling the story, and capital to fuel it.
          </p>
        </div>

        {CATEGORIES.map((cat, ci) => {
          const items = ASSETS.filter((a) => a.category === cat);
          return (
            <div key={cat} className="mb-14 last:mb-0">
              <div className="flex items-baseline gap-3 mb-2 reveal">
                <span className="font-mono2 text-[11px] tracking-[0.2em]" style={{ color: CATEGORY_COLORS[cat] }}>
                  ({String(ci + 1).padStart(2, '0')})
                </span>
                <h3 className="font-mono2 text-[12px] tracking-[0.24em] uppercase text-[#fbfaf5]/85">{cat}</h3>
                <span className="font-mono2 text-[10px] text-[#fbfaf5]/40">
                  {String(items.length).padStart(2, '0')}
                </span>
                <span className="flex-1 h-px bg-[rgba(251,250,245,0.12)] ml-2" />
              </div>
              <div className="divide-y divide-[rgba(251,250,245,0.08)] border-t border-b border-[rgba(251,250,245,0.12)]">
                {items.map((a) => {
                  globalIndex += 1;
                  const idx = globalIndex;
                  return (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="player-row group grid md:grid-cols-12 gap-2 md:gap-6 items-baseline py-5 px-1 reveal"
                    >
                      <div className="md:col-span-1 font-mono2 text-[10px] text-[#fbfaf5]/35">
                        {String(idx).padStart(2, '0')}
                      </div>
                      <div className="md:col-span-4">
                        <span className="font-display uppercase text-2xl md:text-3xl tracking-wide group-hover:text-[#ff8f0c] transition-colors duration-300">
                          {a.name}
                        </span>
                      </div>
                      <div className="md:col-span-3 font-mono2 text-[10.5px] tracking-[0.08em] text-[#fbfaf5]/50 uppercase">
                        {a.location}
                        {a.lat === undefined && (
                          <span className="block text-[#fbfaf5]/30 normal-case tracking-normal mt-0.5">
                            program / network — no fixed venue
                          </span>
                        )}
                      </div>
                      <div className="md:col-span-3 text-[13px] leading-relaxed text-[#fbfaf5]/65">{a.blurb}</div>
                      <div className="md:col-span-1 md:text-right font-mono2 text-sm text-[#fbfaf5]/40 group-hover:text-[#ff8f0c] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300">
                        ↗
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
