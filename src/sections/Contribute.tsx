export default function Contribute() {
  return (
    <section className="noise relative bg-[var(--bg-raise)] py-20 md:py-28 border-t border-[var(--line)] overflow-hidden">
      <div
        aria-hidden
        className="absolute bottom-[-30%] left-[-10%] w-[50vw] h-[50vw] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--hero-glow) 0%, transparent 65%)' }}
      />
      <div className="relative px-5 md:px-10 max-w-[1400px] mx-auto text-center">
        <div className="font-mono2 text-[11px] tracking-[0.22em] text-[var(--accent)] mb-6 reveal">05 / CONTRIBUTE</div>
        <h2 className="font-display uppercase text-[10vw] md:text-[5.5vw] leading-[0.95] reveal">
          This map is a<br />
          <span className="text-[var(--accent)]">living document.</span>
        </h2>
        <p className="mt-8 max-w-xl mx-auto text-[15px] leading-relaxed text-[var(--ink)]/75 reveal">
          Know a builder, space, program or community that belongs here? The ecosystem grows one
          introduction at a time — or help us re-verify the oldest entries. Or take the whole dataset
          and build something we haven't imagined.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 reveal">
          <a
            href="mailto:these3remain@gmail.com?subject=Add%20to%20Builder%20Workshop"
            className="inline-block font-mono2 text-[11px] tracking-[0.2em] bg-[var(--brand)] text-[var(--brand-ink)] px-8 py-4 hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors"
          >
            SUBMIT A PLAYER ↗
          </a>
          <a
            href="/ecosystem.json"
            target="_blank"
            rel="noreferrer"
            className="inline-block font-mono2 text-[11px] tracking-[0.2em] border border-[var(--line-strong)] text-[var(--ink)] px-8 py-4 hover:border-[var(--ink)] transition-colors"
          >
            TAKE THE DATA ↓
          </a>
        </div>
        <p className="mt-6 font-mono2 text-[9.5px] tracking-[0.14em] text-[var(--ink)]/45 reveal">
          OPEN DATA · CC BY 4.0 · JSON + GEOJSON · REGENERATED EVERY BUILD
        </p>
      </div>
    </section>
  );
}
