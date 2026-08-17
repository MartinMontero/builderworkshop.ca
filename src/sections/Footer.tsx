export default function Footer() {
  return (
    <footer className="relative bg-[#0c0e16] border-t border-[rgba(251,250,245,0.1)] pt-16 pb-8 overflow-hidden">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-16">
          <div>
            <div className="font-mono2 text-[10px] tracking-[0.2em] text-[#ff8f0c] mb-3">SITE</div>
            <ul className="space-y-2">
              <li><a href="#map" className="text-sm text-[#fbfaf5]/65 hover:text-[#fbfaf5] transition-colors">The Asset Map</a></li>
              <li><a href="#players" className="text-sm text-[#fbfaf5]/65 hover:text-[#fbfaf5] transition-colors">The Players</a></li>
              <li><a href="#mission" className="text-sm text-[#fbfaf5]/65 hover:text-[#fbfaf5] transition-colors">The Mission</a></li>
            </ul>
          </div>
          <div>
            <div className="font-mono2 text-[10px] tracking-[0.2em] text-[#ff8f0c] mb-3">DATA</div>
            <p className="text-sm text-[#fbfaf5]/55 leading-relaxed">
              Map tiles &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#fbfaf5]">OpenStreetMap</a> contributors.
              Geocoding via Nominatim. Ecosystem listings are community-sourced.
            </p>
          </div>
          <div>
            <div className="font-mono2 text-[10px] tracking-[0.2em] text-[#ff8f0c] mb-3">LAND</div>
            <p className="text-sm text-[#fbfaf5]/55 leading-relaxed">
              Built on the unceded territories of the xʷməθkwəy̓əm (Musqueam), Sḵwx̱wú7mesh (Squamish)
              and səlilwətaɬ (Tsleil-Waututh) Nations.
            </p>
          </div>
          <div>
            <div className="font-mono2 text-[10px] tracking-[0.2em] text-[#ff8f0c] mb-3">SOURCE</div>
            <p className="text-sm text-[#fbfaf5]/55 leading-relaxed">
              This site is open source — fork it, extend it, map your own ecosystem.
            </p>
            <a
              href="https://github.com/MartinMontero/builderworkshop.ca"
              target="_blank"
              rel="noreferrer"
              className="font-mono2 text-[11px] tracking-[0.14em] text-[#ff8f0c] inline-block mt-3 hover:text-[#f6c944] transition-colors"
            >
              GITHUB ↗
            </a>
          </div>
        </div>
      </div>

      <div className="px-2 select-none" aria-hidden>
        <div className="font-display uppercase text-center leading-none text-[12.5vw] whitespace-nowrap text-[#fbfaf5]/[0.08]">
          BUILDER WORKSHOP
        </div>
      </div>

      <div className="px-5 md:px-10 max-w-[1400px] mx-auto mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(251,250,245,0.1)] pt-6">
        <span className="font-mono2 text-[10px] tracking-[0.14em] text-[#fbfaf5]/40">BUILDERWORKSHOP.CA — EST. 2026</span>
        <span className="font-mono2 text-[10px] tracking-[0.14em] text-[#fbfaf5]/40">A WORKSHOP FOR BUILDERS · LOWER MAINLAND, BC</span>
      </div>
    </footer>
  );
}
