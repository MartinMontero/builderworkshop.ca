import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CAPABILITY_LABELS,
  MAPPED,
  PATHWAYS,
  type Asset,
  type Category,
} from '../data/assets';

type Filter = 'All' | Category;

function makeIcon(color: string, active: boolean) {
  return L.divIcon({
    className: 'bw-marker-wrap',
    html: `<span class="bw-marker${active ? ' is-active' : ''}" style="background:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function FlyTo({ target }: { target: Asset | null }) {
  const map = useMap();
  useEffect(() => {
    if (target?.lat && target?.lng) {
      map.flyTo([target.lat, target.lng], 16, { duration: 1.1 });
    }
  }, [target, map]);
  return null;
}

function FitBounds({ items }: { items: Asset[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = items.filter((a) => a.lat !== undefined).map((a) => [a.lat!, a.lng!]) as [number, number][];
    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [48, 48] });
    } else if (pts.length === 1) {
      map.flyTo(pts[0], 14);
    }
  }, [items, map]);
  return null;
}

function TrailFit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.flyToBounds(L.latLngBounds(points), { padding: [60, 60], duration: 1.2 });
    }
  }, [points, map]);
  return null;
}

export default function AssetMap() {
  const [filter, setFilter] = useState<Filter>('All');
  const [cap, setCap] = useState<string | null>(null);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [trailId, setTrailId] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  // pathway cards dispatch bw:trail → draw the route here
  useEffect(() => {
    const onTrail = (e: Event) => {
      setTrailId((e as CustomEvent<string>).detail);
      setFilter('All');
      setCap(null);
      setSelected(null);
    };
    window.addEventListener('bw:trail', onTrail);
    return () => window.removeEventListener('bw:trail', onTrail);
  }, []);

  const trail = useMemo(() => PATHWAYS.find((p) => p.id === trailId) ?? null, [trailId]);
  const trailPoints = useMemo(() => {
    if (!trail) return [] as [number, number][];
    return trail.stops
      .map((sid) => MAPPED.find((a) => a.id === sid))
      .filter((a): a is Asset => !!a && a.lat !== undefined)
      .map((a) => [a.lat!, a.lng!] as [number, number]);
  }, [trail]);

  const filtered = useMemo(
    () =>
      MAPPED.filter(
        (a) =>
          (filter === 'All' || a.category === filter) &&
          (!cap || (a.capabilities ?? []).includes(cap))
      ),
    [filter, cap]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: MAPPED.length };
    for (const cat of CATEGORIES) c[cat] = MAPPED.filter((a) => a.category === cat).length;
    return c;
  }, []);

  const capCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of MAPPED) {
      for (const k of a.capabilities ?? []) c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, []);

  const capInsight = useMemo(() => {
    if (!cap) return null;
    const venues = MAPPED.filter((a) => (a.capabilities ?? []).includes(cap));
    const n = venues.length;
    if (n === 0) return null;
    const hoods: Record<string, number> = {};
    for (const v of venues) {
      const hood = v.location.split('·')[1]?.trim() ?? v.location;
      hoods[hood] = (hoods[hood] ?? 0) + 1;
    }
    const top = Object.entries(hoods).sort((a, b) => b[1] - a[1])[0];
    return `${CAPABILITY_LABELS[cap]}: ${n} venue${n === 1 ? '' : 's'}${top && top[1] > 1 ? ` — densest in ${top[0]}` : ''} — ${venues.map((v) => v.name).slice(0, 4).join(', ')}${n > 4 ? ` +${n - 4} more` : ''}`;
  }, [cap]);

  const select = (a: Asset) => {
    setSelected(a);
    const m = markerRefs.current[a.id];
    if (m) m.openPopup();
  };

  const clearTrail = () => setTrailId(null);

  return (
    <section id="map" className="relative bg-[#12141f] py-20 md:py-28">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10 reveal">
          <div>
            <div className="font-mono2 text-[11px] tracking-[0.22em] text-[#d52b1e] mb-4">01 / THE ASSET MAP</div>
            <h2 className="font-display uppercase text-5xl md:text-7xl leading-[0.95]">
              Where the work<br />gets done.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#fbfaf5]/70">
            Twenty-seven physical venues pinned across British Columbia — powered by OpenStreetMap.
            Filter by what you want to make; program-based players are in the directory below.
          </p>
        </div>

        {/* category pills */}
        <div className="flex flex-wrap gap-2 mb-3 reveal">
          {(['All', ...CATEGORIES] as Filter[])
            .filter((c) => c === 'All' || (counts[c] ?? 0) > 0)
            .map((c) => {
            const active = filter === c;
            const color = c === 'All' ? '#fbfaf5' : CATEGORY_COLORS[c as Category];
            const n = counts[c] ?? 0;
            return (
              <button
                key={c}
                onClick={() => { setFilter(c); setSelected(null); }}
                className={`font-mono2 text-[10.5px] tracking-[0.14em] uppercase px-4 py-2 border transition-all duration-300 ${
                  active
                    ? 'bg-[#fbfaf5] text-[#12141f] border-[#fbfaf5]'
                    : 'border-[rgba(251,250,245,0.2)] text-[#fbfaf5]/75 hover:border-[rgba(251,250,245,0.55)] hover:text-[#fbfaf5]'
                }`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                  style={{ background: active ? '#12141f' : color }}
                />
                {c} <span className="opacity-50">({String(n).padStart(2, '0')})</span>
              </button>
            );
          })}
        </div>

        {/* capability chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6 reveal">
          <span className="font-mono2 text-[9.5px] tracking-[0.2em] text-[#fbfaf5]/55 uppercase mr-1">
            Make something:
          </span>
          {Object.keys(CAPABILITY_LABELS)
            .filter((k) => (capCounts[k] ?? 0) > 0)
            .map((k) => {
              const active = cap === k;
              return (
                <button
                  key={k}
                  onClick={() => { setCap(active ? null : k); setSelected(null); setTrailId(null); }}
                  className={`font-mono2 text-[9.5px] tracking-[0.12em] uppercase px-3 py-1.5 border transition-all duration-300 ${
                    active
                      ? 'bg-[#84bd00] text-[#12141f] border-[#84bd00]'
                      : 'border-[rgba(251,250,245,0.16)] text-[#fbfaf5]/60 hover:border-[#84bd00] hover:text-[#cedc00]'
                  }`}
                >
                  {CAPABILITY_LABELS[k]} <span className="opacity-50">({capCounts[k]})</span>
                </button>
              );
            })}
        </div>

        {/* capability insight line */}
        {capInsight && (
          <div
            aria-live="polite"
            className="mb-6 border-l-2 border-[#84bd00] pl-4 font-mono2 text-[11px] tracking-[0.06em] text-[#cedc00] leading-relaxed reveal"
          >
            {capInsight}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-4 reveal">
          {/* list */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="slim-scroll border border-[rgba(251,250,245,0.14)] lg:h-[72vh] lg:overflow-y-auto divide-y divide-[rgba(251,250,245,0.08)]">
              {filtered.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => select(a)}
                  onMouseEnter={() => setSelected(a)}
                  className={`map-row w-full text-left px-4 py-4 border-l-2 border-transparent flex items-start gap-4 ${
                    selected?.id === a.id ? 'is-active' : ''
                  }`}
                >
                  <span className="font-mono2 text-[10px] text-[#fbfaf5]/55 pt-1.5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="mt-[7px] w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: CATEGORY_COLORS[a.category] }}
                  />
                  <span className="min-w-0">
                    <span className="font-display uppercase text-lg tracking-wide block truncate">{a.name}</span>
                    <span className="font-mono2 text-[10px] tracking-[0.08em] text-[#fbfaf5]/60 block mt-1">
                      {a.location}
                    </span>
                    {cap && (
                      <span className="font-mono2 text-[9px] tracking-[0.1em] text-[#84bd00] block mt-1 uppercase">
                        {(a.capabilities ?? []).map((k) => CAPABILITY_LABELS[k]).join(' · ')}
                      </span>
                    )}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-8">
                  <p className="font-mono2 text-[11px] tracking-[0.06em] text-[#fbfaf5]/70 leading-relaxed">
                    No venues match that combination. Loosen one filter — or the capability you're after
                    might not exist in BC yet. That's a gap worth filling.
                  </p>
                  <button
                    onClick={() => { setFilter('All'); setCap(null); }}
                    className="mt-4 font-mono2 text-[10px] tracking-[0.14em] border border-[#d52b1e] text-[#d52b1e] px-4 py-2 hover:bg-[#d52b1e] hover:text-[#fbfaf5] transition-colors"
                  >
                    CLEAR BOTH FILTERS
                  </button>
                </div>
              )}
            </div>
            <div className="font-mono2 text-[10px] tracking-[0.1em] text-[#fbfaf5]/55 mt-3 px-1 flex items-center justify-between gap-3">
              <span>CLICK A ROW TO FLY TO ITS PIN · {filtered.length} SHOWN</span>
              {(filter !== 'All' || cap || trail) && (
                <button
                  onClick={() => { setFilter('All'); setCap(null); setTrailId(null); setSelected(null); }}
                  className="font-mono2 text-[10px] tracking-[0.14em] text-[#d52b1e] hover:text-[#fbfaf5] transition-colors shrink-0"
                >
                  RESET ✕
                </button>
              )}
            </div>
          </div>

          {/* map */}
          <div
            className="lg:col-span-8 order-1 lg:order-2 border border-[rgba(251,250,245,0.14)] relative"
            role="region"
            aria-label="Interactive map of British Columbia innovation venues on OpenStreetMap"
          >
            {trail && (
              <div className="absolute top-3 right-3 z-[500] flex items-center gap-3 bg-[#0c0e16]/90 border border-[#d52b1e] px-4 py-2">
                <span className="font-mono2 text-[10px] tracking-[0.16em] text-[#fbfaf5] uppercase">
                  Walking: {trail.name}
                </span>
                <button
                  onClick={clearTrail}
                  className="font-mono2 text-[11px] text-[#d52b1e] hover:text-[#fbfaf5] transition-colors"
                  aria-label="Clear trail"
                >
                  ✕
                </button>
              </div>
            )}
            <MapContainer
              center={[49.26, -123.11]}
              zoom={11}
              className="h-[52vh] lg:h-[72vh] w-full"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              {trail ? <TrailFit points={trailPoints} /> : <FitBounds items={filtered} />}
              <FlyTo target={selected} />
              {trail && trailPoints.length > 1 && (
                <Polyline
                  positions={trailPoints}
                  pathOptions={{ color: '#d52b1e', weight: 3, dashArray: '1 9', lineCap: 'round', opacity: 0.9 }}
                />
              )}
              {(trail
                ? trail.stops
                    .map((sid) => MAPPED.find((a) => a.id === sid))
                    .filter((a): a is Asset => !!a && a.lat !== undefined)
                : filtered
              ).map((a) => (
                <Marker
                  key={a.id}
                  position={[a.lat!, a.lng!]}
                  icon={makeIcon(CATEGORY_COLORS[a.category], selected?.id === a.id)}
                  ref={(m) => { markerRefs.current[a.id] = m; }}
                  eventHandlers={{ click: () => setSelected(a) }}
                >
                  <Popup>
                    <div>
                      <div
                        className="font-mono2 text-[9px] tracking-[0.16em] uppercase mb-1.5"
                        style={{ color: CATEGORY_COLORS[a.category] }}
                      >
                        {a.category}
                      </div>
                      <div className="font-display uppercase text-xl tracking-wide leading-tight">{a.name}</div>
                      <div className="font-mono2 text-[10px] text-[#fbfaf5]/55 mt-1.5">{a.location}</div>
                      {a.capabilities && a.capabilities.length > 0 && (
                        <div className="font-mono2 text-[9px] tracking-[0.08em] text-[#84bd00] uppercase mt-1.5">
                          {a.capabilities.map((k) => CAPABILITY_LABELS[k]).join(' · ')}
                        </div>
                      )}
                      <p className="text-[12.5px] leading-relaxed text-[#fbfaf5]/75 mt-2">{a.blurb}</p>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono2 text-[10.5px] tracking-[0.14em] text-[#d52b1e] inline-block mt-3 hover:text-[#cedc00]"
                      >
                        VISIT SITE ↗
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
