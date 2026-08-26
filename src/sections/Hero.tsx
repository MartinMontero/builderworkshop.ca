import { useRef, useState } from 'react';
import { ACTIVE, MAPPED, PATHWAYS, STACK } from '../data/assets';
import { askGuide, dispatchIntent, dispatchQuery, type IntentState } from '../lib/guide';

// FoundedIn Canada's routing note lives in STACK — one source of truth for what
// we say about a partner, so the card and The Builder's Stack cannot drift.
const FIC = STACK.flatMap((s) => s.partners).find((p) => p.name === 'FoundedIn Canada');

type Card = IntentState & { q: string; body: string };

const INTENTS: Card[] = [
  {
    status: 'intent',
    id: 'idea',
    label: 'I have an idea',
    q: 'Back it early.',
    body: 'Programs that take you at the napkin stage — pre-seed incubators, accelerators, founder communities.',
    heading: 'Who backs you at zero.',
    note: 'Programs and communities that take you before there is anything to show.',
    categories: ['Programs & Accelerators', 'Community & Events'],
    stage: 'ZERO → ONE',
  },
  {
    status: 'intent',
    id: 'make',
    label: 'I need to make something',
    q: 'Get your hands on tools.',
    body: 'Makerspaces, fabrication shops, studios and tool libraries — filter the map by the exact machine you need.',
    heading: 'Rooms with machines in them.',
    note: 'Makerspaces, fabrication shops, studios and tool libraries. Filter the map by the exact machine.',
    categories: ['Spaces & Places'],
    stage: null,
    focus: 'map',
  },
  {
    status: 'intent',
    id: 'learn',
    label: 'I want to learn',
    q: 'Level up.',
    body: 'Schools, STEAM academies, grad programs and free public labs across BC.',
    heading: 'Where the skills come from.',
    note: 'Schools, STEAM academies, grad programs and free public labs across BC.',
    categories: ['Learning & Talent'],
    stage: null,
  },
  {
    status: 'intent',
    id: 'people',
    label: "I'm looking for my people",
    q: 'Find the room.',
    body: 'Communities, meetups and the physical third-places where builders actually collide — start with a pathway.',
    heading: 'Where builders actually collide.',
    note: 'Communities and meetups. For the physical third-places, walk a pathway below.',
    categories: ['Community & Events'],
    stage: null,
    // Our own tool, disclosed as such — see IntentState.handoff.ownedByUs.
    handoff: {
      name: 'LUME',
      url: 'https://lume.builderworkshop.ca',
      note: 'Standing rooms for the city: a recurring gathering with a named host, a fixed day and time, at a venue on this map. Open one, or find one to walk into.',
      ownedByUs: true,
    },
  },
  {
    status: 'intent',
    id: 'fund',
    label: 'I need funding',
    q: 'Fuel the build.',
    body: 'Capital, loans and venture builders — plus the funding tools our friends run.',
    heading: 'The thin end of the map.',
    note: 'BC capital is the sparsest category we carry. Everything we have is here — and the deeper funding tools are not ours.',
    categories: ['Capital & Venture'],
    stage: null,
    handoff: FIC
      ? { name: FIC.name, url: FIC.url ?? 'https://foundedincanada.com/', note: FIC.note }
      : undefined,
  },
];

// Starter questions, all verified answerable against the live index —
// spanning capabilities, builder stages and categories in assets.ts.
const STARTERS = [
  'Where can I laser cut something?',
  'I have an idea but no product yet — who helps?',
  'My kid is 12 and into robotics',
  'Who funds early-stage founders in BC?',
];

export default function Hero() {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const go = (target: string) => {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cards are deterministic navigation — they dispatch a named filter state on
  // the same bus the guide uses, with no model call and no network.
  const pick = (card: Card) => {
    dispatchIntent({
      status: 'intent',
      id: card.id,
      label: card.label,
      heading: card.heading,
      note: card.note,
      categories: card.categories,
      stage: card.stage,
      ...(card.focus ? { focus: card.focus } : {}),
      ...(card.handoff ? { handoff: card.handoff } : {}),
    });
    go(card.focus === 'map' ? '#map' : '#players');
  };

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || busy) return;
    setQ(trimmed);
    setBusy(true);
    setOffline(false);
    dispatchQuery({ status: 'loading', question: trimmed });
    go('#players');
    const result = await askGuide(trimmed);
    setBusy(false);
    if (result?.status === 'error') {
      // The guide is down; the directory below keeps working untouched.
      setOffline(true);
      dispatchQuery(null);
      return;
    }
    dispatchQuery(result);
  };

  return (
    <section id="top" className="relative bg-[var(--bg)] pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        <div className="eyebrow mb-6 reveal">
          GREATER VANCOUVER & BRITISH COLUMBIA
        </div>

        <h1 className="font-display uppercase leading-[0.92] text-[12vw] md:text-[7.5vw] max-w-5xl reveal">
          What are you<br />
          <span className="text-[var(--accent)]">building?</span>
        </h1>

        <p className="mt-6 max-w-xl text-[15px] md:text-lg leading-relaxed text-[var(--ink-soft)] reveal">
          This isn't a directory to scroll — it's the shortest path from where you are to a room,
          a tool, and a person who can help. Pick where you're at.
        </p>

        {/* ask the map — a search bar, not a chatbot */}
        <form
          role="search"
          className="mt-10 max-w-2xl reveal"
          onSubmit={(e) => {
            e.preventDefault();
            ask(q);
          }}
        >
          <div className="flex border border-[var(--line-strong)] bg-[var(--bg-raise)] focus-within:border-[var(--ink)] transition-colors">
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What are you trying to build?"
              aria-label="Search the map — describe what you are trying to build"
              disabled={busy}
              className="flex-1 min-w-0 bg-transparent px-4 py-3.5 text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !q.trim()}
              aria-label="Search"
              className="font-mono2 text-[11px] tracking-[0.2em] px-5 md:px-7 bg-[var(--brand)] text-[var(--brand-ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? '…' : 'ASK →'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => ask(s)}
                className="font-mono2 text-[10px] tracking-[0.1em] px-3 py-1.5 border border-[var(--line)] text-[var(--ink)]/60 hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          {offline && (
            <p className="mt-3 font-mono2 text-[10.5px] tracking-[0.08em] text-[var(--ink)]/60">
              The guide is offline right now — the full directory below still works.
            </p>
          )}
        </form>

        {/* intent router */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[var(--line)] border border-[var(--line)] reveal">
          {INTENTS.map((it) => (
            <button
              key={it.id}
              onClick={() => pick(it)}
              className="group bg-[var(--bg)] hover:bg-[var(--bg-raise)] text-left p-5 md:p-6 transition-colors flex flex-col gap-3"
            >
              <span className="eyebrow">
                {it.q}
              </span>
              <span className="font-display uppercase text-xl md:text-2xl leading-tight tracking-wide group-hover:text-[var(--accent)] transition-colors">
                {it.label}
              </span>
              <span className="text-[12px] leading-relaxed text-[var(--ink-soft)]">{it.body}</span>
              <span className="mt-auto font-mono2 text-[11px] text-[var(--ink-faint)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all">
                →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 font-mono2 text-[10px] tracking-[0.16em] text-[var(--ink-faint)] reveal">
          <span>{ACTIVE.length} ECOSYSTEM PLAYERS</span>
          <span>{MAPPED.length} VENUES ON THE MAP</span>
          <span>{PATHWAYS.length} CURATED PATHWAYS</span>
          <span>OPEN DATA · CC BY 4.0</span>
        </div>
      </div>
    </section>
  );
}
