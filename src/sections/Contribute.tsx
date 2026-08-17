export default function Contribute() {
  return (
    <section className="noise relative bg-[#12141f] py-20 md:py-28 border-t border-[rgba(251,250,245,0.1)] overflow-hidden">
      <div
        aria-hidden
        className="absolute bottom-[-30%] left-[-10%] w-[50vw] h-[50vw] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #f6c944 0%, transparent 65%)' }}
      />
      <div className="relative px-5 md:px-10 max-w-[1400px] mx-auto text-center">
        <div className="font-mono2 text-[11px] tracking-[0.22em] text-[#f6c944] mb-6 reveal">04 / CONTRIBUTE</div>
        <h2 className="font-display uppercase text-[10vw] md:text-[5.5vw] leading-[0.95] reveal">
          This map is a<br />
          <span className="text-[#ff8f0c]">living document.</span>
        </h2>
        <p className="mt-8 max-w-xl mx-auto text-[15px] leading-relaxed text-[#fbfaf5]/65 reveal">
          Know a builder, space, program or community that belongs here? The ecosystem grows one
          introduction at a time — send it in and it will find its pin.
        </p>
        <div className="mt-10 reveal">
          <a
            href="mailto:these3remain@gmail.com?subject=Add%20to%20Builder%20Workshop"
            className="inline-block font-mono2 text-[11px] tracking-[0.2em] bg-[#fbfaf5] text-[#12141f] px-8 py-4 hover:bg-[#ff8f0c] transition-colors"
          >
            SUBMIT A PLAYER ↗
          </a>
        </div>
      </div>
    </section>
  );
}
