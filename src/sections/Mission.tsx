const PILLARS = [
  {
    n: '01',
    title: 'ATTRACT',
    body: 'Show the world what’s already here — the spaces, programs and communities that make the Lower Mainland the best place in Canada to start building.',
  },
  {
    n: '02',
    title: 'SUPPORT',
    body: 'Make the ecosystem legible and practical: where to work, who backs early teams, which rooms to walk into, and who’s telling the story.',
  },
  {
    n: '03',
    title: 'RETAIN',
    body: 'Give talent a reason to stay — real community, real infrastructure, and a visible path from first prototype to venture-scale company.',
  },
];

export default function Mission() {
  return (
    <section id="mission" className="relative bg-[#fbfaf5] text-[#12141f] py-20 md:py-28">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        <div className="font-mono2 text-[11px] tracking-[0.22em] text-[#d52b1e] mb-4 reveal">03 / THE MISSION</div>

        <h2 className="font-display uppercase text-[11vw] md:text-[6.5vw] leading-[0.95] max-w-6xl reveal">
          Homegrown innovation,<span className="text-[#d52b1e]"> built to last.</span>
        </h2>

        <div className="grid md:grid-cols-12 gap-10 mt-12 md:mt-16">
          <div className="md:col-span-5 reveal">
            <p className="text-lg md:text-xl leading-relaxed font-medium">
              Greater Vancouver already is a workshop — hackerspaces and accelerators, residencies and
              galleries, cafés and capital — but the pieces have never been on one map. Builder Workshop
              puts them there.
            </p>
            <p className="mt-6 text-[15px] leading-relaxed text-[#12141f]/70">
              The goal: more homegrown innovation that drives prosperity, liberty and clear societal
              benefit — and a Canada that leads the world in human-centric innovation that moves
              humanity forward.
            </p>
          </div>
          <div className="md:col-span-7">
            {PILLARS.map((p) => (
              <div
                key={p.n}
                className="grid grid-cols-12 gap-4 py-6 border-t border-[rgba(18,20,31,0.16)] last:border-b reveal"
              >
                <div className="col-span-2 md:col-span-1 font-mono2 text-[11px] text-[#d52b1e] pt-1">({p.n})</div>
                <div className="col-span-10 md:col-span-3 font-display uppercase text-2xl md:text-3xl tracking-wide">
                  {p.title}
                </div>
                <div className="col-span-12 md:col-span-8 text-[15px] leading-relaxed text-[#12141f]/75">
                  {p.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
