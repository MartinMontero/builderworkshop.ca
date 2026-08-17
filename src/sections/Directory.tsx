import { ASSETS, CATEGORY_COLORS } from '../data/assets';

export default function Directory() {
  return (
    <section id="players" className="relative bg-[#0c0e16] py-20 md:py-28 border-t border-[rgba(251,250,245,0.1)]">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14 reveal">
          <div>
            <div className="font-mono2 text-[11px] tracking-[0.22em] text-[#d52b1e] mb-4">02 / THE PLAYERS</div>
            <h2 className="font-display uppercase text-5xl md:text-7xl leading-[0.95]">
              Forty-two<br />ways in.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#fbfaf5]/60">
            Spaces to sit down and build. Programs that back you early. Schools that grow the next
            generation. Communities that show up. People telling the story, and capital to fuel it —
            one ranked list, in the order we'd walk in the door.
          </p>
        </div>

        <div className="divide-y divide-[rgba(251,250,245,0.08)] border-t border-b border-[rgba(251,250,245,0.12)]">
          {ASSETS.map((a, i) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="player-row group grid md:grid-cols-12 gap-2 md:gap-6 items-baseline py-5 px-1 reveal"
            >
              <div className="md:col-span-1 font-mono2 text-[10px] text-[#fbfaf5]/35">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="md:col-span-3">
                <span className="font-display uppercase text-2xl md:text-3xl tracking-wide group-hover:text-[#d52b1e] transition-colors duration-300">
                  {a.name}
                </span>
              </div>
              <div
                className="md:col-span-2 font-mono2 text-[9.5px] tracking-[0.14em] uppercase"
                style={{ color: CATEGORY_COLORS[a.category] }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                  style={{ background: CATEGORY_COLORS[a.category] }}
                />
                {a.category}
              </div>
              <div className="md:col-span-2 font-mono2 text-[10.5px] tracking-[0.08em] text-[#fbfaf5]/50 uppercase">
                {a.location}
                {a.lat === undefined && (
                  <span className="block text-[#fbfaf5]/30 normal-case tracking-normal mt-0.5">
                    program / network — no fixed venue
                  </span>
                )}
              </div>
              <div className="md:col-span-3 text-[13px] leading-relaxed text-[#fbfaf5]/65">{a.blurb}</div>
              <div className="md:col-span-1 md:text-right font-mono2 text-sm text-[#fbfaf5]/40 group-hover:text-[#d52b1e] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300">
                ↗
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
