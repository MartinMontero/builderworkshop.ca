import { useEffect, useState } from 'react';

const LINKS = [
  { label: 'THE MAP', href: '#map' },
  { label: 'THE PLAYERS', href: '#players' },
  { label: 'THE PATHS', href: '#paths' },
  { label: 'THE MISSION', href: '#mission' },
];

export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y > lastY && y > 300) setHidden(true);
      else setHidden(false);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-nav fixed top-0 left-0 right-0 z-[1000] ${hidden ? 'nav-hidden' : ''}`}>
      <div
        className={`mx-auto flex items-center justify-between px-5 md:px-10 py-4 transition-all duration-500 ${
          scrolled ? 'backdrop-blur-md bg-[#0c0e16]/80 border-b border-[rgba(251,250,245,0.1)]' : ''
        }`}
      >
        <a href="#top" className="flex items-center gap-3 group">
          <span className="block w-2.5 h-2.5 bg-[#d52b1e] group-hover:rotate-45 transition-transform duration-300" />
          <span className="font-display text-lg md:text-xl tracking-wide uppercase">Builder Workshop</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono2 text-[11px] tracking-[0.18em] text-[#fbfaf5]/70 hover:text-[#fbfaf5] transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="mailto:these3remain@gmail.com?subject=Add%20a%20player%20to%20the%20map"
            className="font-mono2 text-[11px] tracking-[0.18em] bg-[#fbfaf5] text-[#12141f] px-4 py-2 hover:bg-[#d52b1e] hover:text-[#fbfaf5] transition-colors"
          >
            ADD A PLAYER ↗
          </a>
        </nav>
        <a
          href="#map"
          className="md:hidden font-mono2 text-[11px] tracking-[0.18em] bg-[#fbfaf5] text-[#12141f] px-3 py-2"
        >
          MAP ↓
        </a>
      </div>
    </header>
  );
}
