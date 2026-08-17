const STATS = [
  { value: '25', label: 'ECOSYSTEM PLAYERS LISTED' },
  { value: '14', label: 'VENUES ON THE ASSET MAP' },
  { value: '#2', label: 'AI TALENT CONCENTRATION IN CANADA' },
  { value: '500+', label: 'AI COMPANIES IN B.C.' },
];

export default function Hero() {
  return (
    <section id="top" className="noise relative min-h-screen flex flex-col justify-end overflow-hidden bg-[#0c0e16]">
      {/* faint coordinate grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(251,250,245,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251,250,245,0.5) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      {/* orange horizon glow */}
      <div
        aria-hidden
        className="absolute -top-40 right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-25 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #ff8f0c 0%, transparent 65%)' }}
      />

      <div className="relative px-5 md:px-10 pt-32 pb-10 md:pb-14 max-w-[1400px] w-full mx-auto">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 reveal">
          <span className="font-mono2 text-[11px] tracking-[0.22em] text-[#ff8f0c]">LOWER MAINLAND · BRITISH COLUMBIA</span>
          <span className="font-mono2 text-[11px] tracking-[0.22em] text-[#fbfaf5]/45">49.2827°N — 123.1207°W</span>
        </div>

        <h1 className="font-display uppercase leading-[0.94] text-[13.5vw] md:text-[9.2vw] reveal">
          Greater Vancouver
          <br />
          is a <span className="text-[#ff8f0c]">workshop</span>
          <br />
          for <span className="text-[#f6c944]">builders.</span>
        </h1>

        <div className="mt-10 md:mt-14 grid md:grid-cols-12 gap-8 items-end">
          <p className="md:col-span-5 text-[15px] md:text-base leading-relaxed text-[#fbfaf5]/70 reveal">
            This is a practical map of the people, places and programs turning the Lower Mainland into
            Canada’s most hands-on innovation ecosystem — so talent arrives, stays, and builds what’s next.
          </p>
          <div className="md:col-span-7 reveal">
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-[rgba(251,250,245,0.14)]">
              {STATS.map((s) => (
                <div key={s.label} className="pt-4 pr-4 border-l border-[rgba(251,250,245,0.14)] pl-4 first:border-l-0 first:pl-0 md:first:pl-0">
                  <div className="font-display text-3xl md:text-4xl text-[#fbfaf5]">{s.value}</div>
                  <div className="font-mono2 text-[9.5px] tracking-[0.16em] text-[#fbfaf5]/50 mt-1.5 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-4 reveal">
          <a
            href="#map"
            className="font-mono2 text-[11px] tracking-[0.2em] bg-[#ff8f0c] text-[#12141f] px-6 py-3.5 hover:bg-[#f6c944] transition-colors"
          >
            EXPLORE THE ASSET MAP
          </a>
          <a
            href="#players"
            className="font-mono2 text-[11px] tracking-[0.2em] border border-[rgba(251,250,245,0.3)] px-6 py-3.5 hover:border-[#fbfaf5] transition-colors"
          >
            MEET THE PLAYERS
          </a>
          <div className="hidden md:flex flex-1 justify-end">
            <span className="scroll-cue block w-px h-14 bg-[#ff8f0c]" />
          </div>
        </div>
      </div>
    </section>
  );
}
