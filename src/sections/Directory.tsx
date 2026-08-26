import { useEffect, useState } from 'react';
import { ACTIVE, CATEGORY_COLORS, STAGES, STAGE_COLORS, type Stage } from '../data/assets';
import {
  dispatchQuery,
  filterDirectory,
  filterIntent,
  goUrl,
  onQuery,
  type QueryState,
} from '../lib/guide';
import { describeRooms, fetchRoomCounts, type RoomSummary } from '../lib/lume';

export default function Directory() {
  const [stage, setStage] = useState<Stage | null>(null);
  const [query, setQuery] = useState<QueryState>(null);

  useEffect(() => onQuery(setQuery), []);

  // Live counts for a handoff we built. Fetched only when that card is showing,
  // and never blocking it: null means the card renders without numbers rather
  // than waiting on, or failing with, LUME.
  const [rooms, setRooms] = useState<RoomSummary | null>(null);
  const [roomsLoaded, setRoomsLoaded] = useState(false);
  const showingOurTool = query?.status === 'intent' && query.handoff?.ownedByUs === true;
  useEffect(() => {
    if (!showingOurTool || roomsLoaded) return;
    let live = true;
    fetchRoomCounts().then((summary) => {
      if (!live) return;
      setRooms(summary);
      setRoomsLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [showingOurTool, roomsLoaded]);

  const active = query?.status === 'done' ? query : null;
  const intent = query?.status === 'intent' ? query : null;
  const whys = new Map(active?.results.map((r) => [r.id, r.why]) ?? []);
  const queryIds = active ? active.results.map((r) => r.id) : null;
  const shown = intent
    ? filterIntent(ACTIVE, intent, stage)
    : filterDirectory(ACTIVE, stage, queryIds);
  const filtered = active !== null || intent !== null;
  const loading = query?.status === 'loading';
  const correction = active?.correction ?? null;
  const zero = active !== null && active.results.length === 0 && !correction;

  const clear = () => dispatchQuery(null);

  return (
    <section id="players" className="relative bg-[var(--bg)] py-20 md:py-28 border-t border-[var(--line)]">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14 reveal">
          <div>
            <div className="eyebrow mb-4">THE PLAYERS</div>
            <h2 className="font-display uppercase text-5xl md:text-7xl leading-[0.95]">
              {intent ? (
                intent.heading
              ) : (
                <>
                  {ACTIVE.length} places<br />to start.
                </>
              )}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--ink)]/70">
            {intent ? intent.note : null}
            {intent ? null : (<>Spaces to sit down and build. Programs that back you early. Schools that grow the next
            generation. Communities that show up. People telling the story, and capital to fuel it —
            one ranked list, in the order we'd walk in the door.</>)}
          </p>
        </div>

        {/* active card bar — same dismissible pattern as a question */}
        {intent && (
          <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 border border-[var(--accent)] bg-[var(--bg-raise)] px-4 py-3">
            <span className="font-mono2 text-[9.5px] tracking-[0.2em] text-[var(--accent)] uppercase shrink-0">
              Showing
            </span>
            <span className="text-[13px] text-[var(--ink)] min-w-0">{intent.label}</span>
            <span
              className="font-mono2 text-[10px] tracking-[0.1em] text-[var(--ink)]/60"
              aria-live="polite"
            >
              {shown.length} of {ACTIVE.length}
            </span>
            <button
              type="button"
              onClick={clear}
              className="ml-auto font-mono2 text-[10px] tracking-[0.14em] text-[var(--accent)] hover:text-[var(--ink)] transition-colors uppercase"
            >
              Clear ✕
            </button>
          </div>
        )}

        {/* the partner handoff is the main event on a thin category */}
        {intent?.handoff && (
          <a
            href={goUrl(intent.handoff.url, `card:${intent.id}`)}
            target="_blank"
            rel="noreferrer"
            className="group block mb-8 border border-[var(--line-strong)] bg-[var(--bg-raise)] px-6 py-6 md:px-8 hover:border-[var(--accent)] transition-colors"
          >
            <div className="eyebrow mb-3 text-[var(--accent)]">GO HERE FIRST</div>
            <div className="font-display uppercase text-2xl md:text-3xl tracking-wide group-hover:text-[var(--accent)] transition-colors">
              {intent.handoff.name} ↗
            </div>
            <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-[var(--ink)]/70">
              {intent.handoff.note}
            </p>

            {/* Live counts, or nothing. A stale number is never shown as current. */}
            {intent.handoff.ownedByUs && roomsLoaded && describeRooms(rooms) && (
              <p className="mt-3 max-w-2xl font-mono2 text-[11.5px] tracking-[0.04em] leading-relaxed text-[var(--accent)]">
                {describeRooms(rooms)}
              </p>
            )}

            {/* The disclosure. Same treatment as a partner handoff, so say whose it is. */}
            {intent.handoff.ownedByUs && (
              <p className="mt-4 font-mono2 text-[10px] tracking-[0.14em] uppercase text-[var(--ink)]/45">
                Built by builderworkshop.ca
              </p>
            )}
          </a>
        )}

        {/* active question bar */}
        {(active || loading) && (
          <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 border border-[var(--accent)] bg-[var(--bg-raise)] px-4 py-3">
            <span className="font-mono2 text-[9.5px] tracking-[0.2em] text-[var(--accent)] uppercase shrink-0">
              You asked
            </span>
            <span className="text-[13px] text-[var(--ink)] min-w-0">
              "{query?.status === 'loading' || query?.status === 'done' ? query.question : ''}"
            </span>
            <span className="font-mono2 text-[10px] tracking-[0.1em] text-[var(--ink)]/60" aria-live="polite">
              {loading ? 'searching the map…' : `${shown.length} match${shown.length === 1 ? '' : 'es'}`}
            </span>
            <button
              type="button"
              onClick={clear}
              className="ml-auto font-mono2 text-[10px] tracking-[0.14em] text-[var(--accent)] hover:text-[var(--ink)] transition-colors uppercase"
            >
              Clear ✕
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-8 reveal" role="group" aria-label="Filter players by builder stage">
          <button
            type="button"
            onClick={() => setStage(null)}
            aria-pressed={stage === null}
            className={`font-mono2 text-[10px] tracking-[0.14em] uppercase px-3 py-1.5 border transition-colors duration-200 ${
              stage === null
                ? 'border-[var(--ink)] text-[var(--ink)]'
                : 'border-[var(--line)] text-[var(--ink)]/55 hover:text-[var(--ink)]'
            }`}
          >
            All stages
          </button>
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(stage === s ? null : s)}
              aria-pressed={stage === s}
              className={`font-mono2 text-[10px] tracking-[0.14em] uppercase px-3 py-1.5 border transition-colors duration-200 ${
                stage === s ? 'text-[var(--bg)]' : 'border-[var(--line)] text-[var(--ink)]/55 hover:text-[var(--ink)]'
              }`}
              style={
                stage === s
                  ? { background: STAGE_COLORS[s], borderColor: STAGE_COLORS[s] }
                  : undefined
              }
            >
              {s}
            </button>
          ))}
          <span className="font-mono2 text-[10px] tracking-[0.08em] text-[var(--ink)]/50 ml-1" aria-live="polite">
            {loading ? 'searching…' : `${shown.length} of ${ACTIVE.length}`}
          </span>
        </div>

        {/* skeleton while the guide searches — rows, not a spinner */}
        {loading && (
          <div className="divide-y divide-[var(--line)] border-t border-b border-[var(--line)]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid md:grid-cols-12 gap-2 md:gap-6 items-baseline py-5 px-1">
                <div className="md:col-span-1"><div className="skeleton h-4 w-6" /></div>
                <div className="md:col-span-3"><div className="skeleton h-8 w-3/4" /></div>
                <div className="md:col-span-2"><div className="skeleton h-3 w-2/3" /></div>
                <div className="md:col-span-2"><div className="skeleton h-3 w-1/2" /></div>
                <div className="md:col-span-4"><div className="skeleton h-3 w-full" /></div>
              </div>
            ))}
          </div>
        )}

        {/* a correction was recorded — not a failed search */}
        {!loading && correction && (
          <div className="border border-[var(--line)] bg-[var(--bg-raise)] px-6 py-8 md:px-10">
            <div className="eyebrow mb-3 text-[var(--accent)]">NOTED</div>
            <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--ink)]">{correction}</p>
            <button
              type="button"
              onClick={clear}
              className="mt-6 font-mono2 text-[10.5px] tracking-[0.18em] border border-[var(--line-strong)] text-[var(--ink)] px-6 py-3 hover:border-[var(--ink)] transition-colors uppercase"
            >
              Back to all {ACTIVE.length}
            </button>
          </div>
        )}

        {/* zero results is a finding, not a dead end */}
        {!loading && zero && (
          <div className="border border-[var(--line)] bg-[var(--bg-raise)] px-6 py-10 md:px-10">
            <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--ink)]">
              {active.gap?.message ?? 'Nothing on this map serves that need yet.'}
            </p>
            {active.gap && active.gap.categories.length > 0 && (
              <p className="mt-3 max-w-2xl font-mono2 text-[11px] tracking-[0.08em] text-[var(--ink)]/60 uppercase">
                Closest categories: {active.gap.categories.join(' · ')}
              </p>
            )}
            <p className="mt-5 max-w-2xl text-[13.5px] leading-relaxed text-[var(--ink)]/70">
              An empty answer here is a real finding — it means British Columbia may not have this
              yet. If you know a place, program or community that should be on this map, add it.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href="#contribute"
                className="font-mono2 text-[10.5px] tracking-[0.18em] bg-[var(--brand)] text-[var(--brand-ink)] px-6 py-3 hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors uppercase"
              >
                Contribute it ↓
              </a>
              <button
                type="button"
                onClick={clear}
                className="font-mono2 text-[10.5px] tracking-[0.18em] border border-[var(--line-strong)] text-[var(--ink)] px-6 py-3 hover:border-[var(--ink)] transition-colors uppercase"
              >
                Back to all {ACTIVE.length}
              </button>
            </div>
          </div>
        )}

        {!loading && !zero && !correction && (
          <div className="divide-y divide-[var(--line)] border-t border-b border-[var(--line)]">
            {shown.map((a, i) => {
              const podium = !filtered && i < 10;
              const tail = !filtered && i >= 26;
              const why = whys.get(a.id);
              const href = active
                ? goUrl(a.url, active.queryClass)
                : intent
                  ? goUrl(a.url, `card:${intent.id}`)
                  : a.url;
              return (
                <a
                  key={a.id}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className={`player-row group grid md:grid-cols-12 gap-2 md:gap-6 items-baseline py-5 px-1 ${filtered ? '' : 'reveal'}`}
                >
                  <div
                    className={`md:col-span-1 font-mono2 ${
                      podium || filtered ? 'text-sm text-[var(--accent)]' : 'text-[10px] text-[var(--ink)]/55'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="md:col-span-3">
                    <span
                      className={`font-display uppercase tracking-wide group-hover:text-[var(--accent)] transition-colors duration-300 ${
                        podium || filtered
                          ? 'text-3xl md:text-4xl'
                          : tail
                            ? 'text-xl md:text-2xl'
                            : 'text-2xl md:text-3xl'
                      }`}
                    >
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
                    <span className="flex flex-wrap gap-1 mt-1.5">
                      {a.stages.map((st) => (
                        <span
                          key={st}
                          className="inline-block text-[8.5px] tracking-[0.1em] px-1.5 py-0.5 border"
                          style={{ color: STAGE_COLORS[st], borderColor: STAGE_COLORS[st] }}
                        >
                          {st}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="md:col-span-2 font-mono2 text-[10.5px] tracking-[0.08em] text-[var(--ink)]/60 uppercase">
                    {a.location}
                    {a.lat === undefined && (
                      <span className="block text-[var(--ink)]/50 normal-case tracking-normal mt-0.5">
                        program / network — no fixed venue
                      </span>
                    )}
                    {a.verified && (
                      <span className="block text-[var(--ink)]/40 normal-case tracking-normal mt-0.5">
                        verified {a.verified}
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-3 text-[13px] leading-relaxed text-[var(--ink)]/70">
                    {a.blurb}
                    {why && (
                      <span className="block mt-2 border-l-2 border-[var(--accent)] pl-3 font-mono2 text-[11px] tracking-[0.04em] text-[var(--accent)] leading-relaxed">
                        {why}
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-1 md:text-right font-mono2 text-sm text-[var(--ink)]/55 group-hover:text-[var(--accent)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300">
                    ↗
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
