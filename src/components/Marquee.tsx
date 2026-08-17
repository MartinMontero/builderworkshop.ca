const WORDS = [
  'HACKERSPACES',
  'COWORKING',
  'ACCELERATORS',
  'RESIDENCIES',
  'MAKERSPACES',
  'YOUTH ACADEMIES',
  'GRAD SCHOOLS',
  'CAFÉS',
  'MEDIA',
  'CAPITAL',
  'COMMUNITY',
  'DECENTRALIZED WEB',
  'GALLERIES',
];

export default function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="bg-[#d52b1e] text-[#fbfaf5] overflow-hidden border-y border-[#12141f] py-3 select-none">
      <div className="marquee-track">
        {row.map((w, i) => (
          <span key={i} className="flex items-center whitespace-nowrap">
            <span className="font-display uppercase text-xl md:text-2xl tracking-wide px-5">{w}</span>
            <span className="block w-2 h-2 bg-[#fbfaf5] rotate-45" />
          </span>
        ))}
      </div>
    </div>
  );
}
