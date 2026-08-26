import { useEffect, useState } from 'react';

/*
  `id` is the React key, deliberately separate from `href`.

  Two links may legitimately share a destination, so keying on href made a
  duplicate key inevitable — and React's response to that is to render one of
  them wrong rather than to complain loudly. Keying on an explicit id means a
  future collision is a duplicated id, which is visible in this array and
  caught by the nav test.

  THE STACK and THE PATHS previously both pointed at #paths, which is the
  section wrapper. The Stack sits at the top of that section, so BOTH links
  landed on the Stack and the pathways were unreachable from the nav. They now
  target the two anchors inside it. #paths itself is still a valid anchor and
  is referenced by public/sitemap.xml — do not remove it.
*/
const LINKS = [
  { id: 'stack', n: '00', label: 'THE STACK', href: '#stack' },
  { id: 'map', n: '01', label: 'THE MAP', href: '#map' },
  { id: 'players', n: '02', label: 'THE PLAYERS', href: '#players' },
  { id: 'pathways', n: '03', label: 'THE PATHS', href: '#pathways' },
  { id: 'mission', n: '04', label: 'THE MISSION', href: '#mission' },
];

const PARTNERS = [
  { label: 'BUILDRS.DEV', href: 'https://buildrs.dev/', icon: 'data:image/png;base64,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' },
  { label: 'FOUNDEDIN', href: 'https://foundedincanada.com/', icon: 'data:image/png;base64,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' },
];

export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // the boot script in index.html has already stamped data-theme by now
  const [theme, setTheme] = useState<string>(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('bw-theme', next); } catch { /* storage unavailable (private mode) — theme still applies for this visit */ }
  };

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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header className={`site-nav fixed top-0 left-0 right-0 z-[1000] ${hidden && !open ? 'nav-hidden' : ''}`}>
        <div
          className={`mx-auto flex items-center justify-between px-5 md:px-10 py-4 transition-all duration-500 ${
            scrolled || open ? 'nav-scrolled' : ''
          }`}
        >
          <a href="#top" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <span className="block w-2.5 h-2.5 bg-[#d52b1e] group-hover:rotate-45 transition-transform duration-300" />
            <span className="font-display text-lg md:text-xl tracking-wide uppercase">Builder Workshop</span>
          </a>
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={l.href}
                className="font-mono2 text-[11px] tracking-[0.18em] text-[var(--ink)]/75 hover:text-[var(--ink)] transition-colors"
              >
                {l.label}
              </a>
            ))}
            <span className="hidden xl:block w-px h-5 bg-[var(--line)]" />
            {PARTNERS.map((p) => (
              <a
                key={p.label}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="hidden xl:flex items-center gap-2 font-mono2 text-[10px] tracking-[0.14em] text-[var(--ink)]/60 hover:text-[var(--ink)] border border-[var(--line)] hover:border-[var(--forest)] px-3 py-2 transition-colors"
              >
                <img src={p.icon} alt="" className="w-3.5 h-3.5 object-contain" />
                {p.label}
              </a>
            ))}
            <a
              href="mailto:these3remain@gmail.com?subject=Add%20a%20player%20to%20the%20map"
              className="font-mono2 text-[11px] tracking-[0.18em] bg-[var(--ink)] text-[var(--bg)] px-4 py-2 hover:bg-[var(--brand)] hover:text-[var(--brand-ink)] transition-colors"
            >
              Add a player ↗
            </a>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Light' : 'Dark'}
            >
              {theme === 'dark' ? 'LIGHT ◐' : 'DARK ◑'}
            </button>
          </nav>
          <button
            className="md:hidden font-mono2 text-[11px] tracking-[0.18em] bg-[var(--ink)] text-[var(--bg)] px-3 py-2"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? 'CLOSE ✕' : 'MENU ☰'}
          </button>
        </div>
      </header>

      {/* full-screen mobile menu */}
      <div
        className={`fixed inset-0 z-[990] bg-[var(--bg)] flex flex-col justify-between px-5 pt-24 pb-8 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!open}
      >
        <nav aria-label="Mobile">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-baseline gap-4 py-4 border-t border-[var(--line)] last:border-b group"
            >
              <span className="font-mono2 text-[11px] text-[var(--accent)]">{l.n}</span>
              <span className="font-display uppercase text-4xl tracking-wide group-hover:text-[var(--accent)] transition-colors">
                {l.label}
              </span>
            </a>
          ))}
        </nav>
        <div>
          <div className="font-mono2 text-[9.5px] tracking-[0.2em] text-[var(--ink)]/40 uppercase mb-3">In the ecosystem</div>
          <div className="flex flex-wrap gap-2">
            {PARTNERS.map((p) => (
              <a
                key={p.label}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 font-mono2 text-[10px] tracking-[0.14em] text-[var(--ink)]/70 border border-[var(--line)] px-3 py-2.5"
              >
                <img src={p.icon} alt="" className="w-3.5 h-3.5 object-contain" />
                {p.label} ↗
              </a>
            ))}
            <a
              href="mailto:these3remain@gmail.com?subject=Add%20a%20player%20to%20the%20map"
              className="flex items-center font-mono2 text-[10px] tracking-[0.14em] bg-[var(--ink)] text-[var(--bg)] px-3 py-2.5"
            >
              Add a player ↗
            </a>
            <button
              onClick={toggleTheme}
              className="flex items-center theme-toggle"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? 'LIGHT ◐' : 'DARK ◑'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
