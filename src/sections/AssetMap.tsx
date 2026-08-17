import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORIES, CATEGORY_COLORS, MAPPED, type Asset, type Category } from '../data/assets';

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

export default function AssetMap() {
  const [filter, setFilter] = useState<Filter>('All');
  const [selected, setSelected] = useState<Asset | null>(null);
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const filtered = useMemo(
    () => MAPPED.filter((a) => filter === 'All' || a.category === filter),
    [filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: MAPPED.length };
    for (const cat of CATEGORIES) c[cat] = MAPPED.filter((a) => a.category === cat).length;
    return c;
  }, []);

  const select = (a: Asset) => {
    setSelected(a);
    const m = markerRefs.current[a.id];
    if (m) m.openPopup();
  };

  return (
    <section id="map" className="relative bg-[#12141f] py-20 md:py-28">
      <div className="px-5 md:px-10 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10 reveal">
          <div>
            <div className="font-mono2 text-[11px] tracking-[0.22em] text-[#ff3b30] mb-4">01 / THE ASSET MAP</div>
            <h2 className="font-display uppercase text-5xl md:text-7xl leading-[0.95]">
              Where the work<br />gets done.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#fbfaf5]/60">
            Twenty-four physical venues pinned across British Columbia — powered by OpenStreetMap.
            Program-based and regional players are listed in the directory below.
          </p>
        </div>

        {/* filter pills */}
        <div className="flex flex-wrap gap-2 mb-6 reveal">
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
                    : 'border-[rgba(251,250,245,0.2)] text-[#fbfaf5]/65 hover:border-[rgba(251,250,245,0.55)] hover:text-[#fbfaf5]'
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
                  <span className="font-mono2 text-[10px] text-[#fbfaf5]/40 pt-1.5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="mt-[7px] w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: CATEGORY_COLORS[a.category] }}
                  />
                  <span className="min-w-0">
                    <span className="font-display uppercase text-lg tracking-wide block truncate">{a.name}</span>
                    <span className="font-mono2 text-[10px] tracking-[0.08em] text-[#fbfaf5]/50 block mt-1">
                      {a.location}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <div className="font-mono2 text-[10px] tracking-[0.1em] text-[#fbfaf5]/40 mt-3 px-1">
              CLICK A ROW TO FLY TO ITS PIN · {filtered.length} SHOWN
            </div>
          </div>

          {/* map */}
          <div className="lg:col-span-8 order-1 lg:order-2 border border-[rgba(251,250,245,0.14)]">
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
              <FitBounds items={filtered} />
              <FlyTo target={selected} />
              {filtered.map((a) => (
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
                      <p className="text-[12.5px] leading-relaxed text-[#fbfaf5]/75 mt-2">{a.blurb}</p>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono2 text-[10.5px] tracking-[0.14em] text-[#ff3b30] inline-block mt-3 hover:text-[#4fc3f7]"
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
