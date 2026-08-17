export type Category =
  | 'Spaces & Places'
  | 'Programs & Accelerators'
  | 'Learning & Talent'
  | 'Community & Events'
  | 'Media & Storytelling'
  | 'Capital & Venture';

export interface Asset {
  id: string;
  name: string;
  category: Category;
  url: string;
  blurb: string;
  location: string;
  lat?: number;
  lng?: number;
  capabilities?: string[];
}

export interface Pathway {
  id: string;
  name: string;
  blurb: string;
  stops: string[]; // asset ids, in walking order
}

export const CATEGORY_COLORS: Record<Category, string> = {
  'Spaces & Places': '#d52b1e',
  'Programs & Accelerators': '#f5b800',
  'Learning & Talent': '#34c76b',
  'Community & Events': '#84bd00',
  'Media & Storytelling': '#ff8fa3',
  'Capital & Venture': '#e8ecf4',
};

export const CATEGORIES: Category[] = [
  'Spaces & Places',
  'Programs & Accelerators',
  'Learning & Talent',
  'Community & Events',
  'Media & Storytelling',
  'Capital & Venture',
];

export const CAPABILITY_LABELS: Record<string, string> = {
  '3d-print': '3D Printing',
  laser: 'Laser Cutting',
  cnc: 'CNC',
  wood: 'Woodshop',
  metal: 'Metalshop',
  electronics: 'Electronics',
  robotics: 'Robotics',
  glass: 'Glass',
  ceramics: 'Ceramics',
  recording: 'Recording & Podcast',
  digitization: 'Digitization',
};

// Array order = directory ranking (01–44).
export const ASSETS: Asset[] = [
  {
    id: 'dctrl',
    name: 'DCTRL',
    category: 'Spaces & Places',
    url: 'https://www.dctrl.wtf/',
    blurb:
      "Vancouver's longest-running home for Bitcoin, crypto and decentralized tech — a member-run, non-profit cypherpunk coworking and event studio operating since 2013.",
    location: '328 W Hastings St · Gastown',
    lat: 49.2829423,
    lng: -123.1107804,
  },
  {
    id: 'launch',
    name: 'Launch Academy',
    category: 'Programs & Accelerators',
    url: 'https://www.launchacademy.ca/',
    blurb:
      'Non-profit incubator that has supported 6,000+ entrepreneurs since 2012 — alumni include Thinkific and have collectively raised over $1.2B. Home of LaunchPad, Maple and Startup Visa programs.',
    location: '350–128 W Hastings St · Gastown',
    lat: 49.2818936,
    lng: -123.1081537,
  },
  {
    id: 'friendsquarters',
    name: 'FriendsQuarters',
    category: 'Spaces & Places',
    url: 'https://www.friendsquarters.com/',
    blurb:
      "Vancouver's friendliest coworking, connection and media space — 5,500 sq ft with hot desks, a podcast room and an atrium, steps from Waterfront Station.",
    location: '200–116 W Hastings St · Gastown',
    lat: 49.2818562,
    lng: -123.107943,
    capabilities: ['recording'],
  },
  {
    id: 'dwebyvr',
    name: 'DWeb Vancouver',
    category: 'Community & Events',
    url: 'https://dwebyvr.org/',
    blurb:
      'The official Vancouver node of the global DWeb movement sparked by the Internet Archive — volunteer-run meetups and a community calendar for tech built on human agency, mutual respect and distributed benefit.',
    location: 'Around town · Lu.ma calendar',
  },
  {
    id: 'internetarchive',
    name: 'Internet Archive Canada',
    category: 'Learning & Talent',
    url: 'https://internetarchivecanada.org/',
    blurb:
      'The Canadian arm of the Internet Archive — a non-profit digital library headquartered at The Permanent on West Pender, working with universities and memory institutions toward universal access to all knowledge.',
    location: '330 W Pender St · Crosstown',
    lat: 49.2832,
    lng: -123.1149,
    capabilities: ['digitization'],
  },
  {
    id: 'basecamp',
    name: 'Basecamp',
    category: 'Spaces & Places',
    url: 'https://basecampyvr.ca/',
    blurb:
      'A live-and-build residency for creators, entrepreneurs and community builders at HI Jericho Beach — focused, affordable housing from $600/month so residents can ship a version one.',
    location: '1515 Discovery St · Jericho Beach',
    lat: 49.27295,
    lng: -123.2032773,
  },
  {
    id: 'ethoslab',
    name: 'Ethọ́s Lab',
    category: 'Learning & Talent',
    url: 'https://ethoslab.ca/',
    blurb:
      'Non-profit STEAM innovation academy for youth in Grades 5–12 — afterschool project-based programs grounded in Ubuntu, building the next generation of diverse creators.',
    location: '177 E 3rd Ave · Mount Pleasant',
    lat: 49.2683654,
    lng: -123.1012334,
    capabilities: ['3d-print', 'robotics'],
  },
  {
    id: 'funk',
    name: 'FUNK Coffee Bar',
    category: 'Spaces & Places',
    url: 'https://funk.coffee',
    blurb:
      'Coffee-centric downtown bar from the House of Funk crew — the unofficial third place where half the ecosystem’s first meetings actually happen.',
    location: '1025 Dunsmuir St · Downtown',
    lat: 49.2863433,
    lng: -123.120525,
  },
  {
    id: 'slice',
    name: 'Slice of Life',
    category: 'Spaces & Places',
    url: 'https://www.slicevancouver.ca/',
    blurb:
      'Art gallery, studios and clubhouse giving 100+ local artists room to exhibit — plus thrift, pinball, life drawing, clay club and coworking days. Open daily, free entry.',
    location: '1636 Venables St · Grandview-Woodland',
    lat: 49.2765511,
    lng: -123.0704529,
  },
  {
    id: 'vhs',
    name: 'Vancouver Hack Space',
    category: 'Spaces & Places',
    url: 'https://vanhack.ca/',
    blurb:
      'Community-run makerspace for people who make personal projects and learn by doing — 3D printing, laser cutting, woodworking, machining, robotics, welding, electronics and more.',
    location: '1601 Venables St · Grandview-Woodland',
    lat: 49.2769261,
    lng: -123.0725869,
    capabilities: ['3d-print', 'laser', 'wood', 'metal', 'electronics', 'robotics'],
  },
  {
    id: 'flowstatefounder',
    name: 'Flow State Founder',
    category: 'Programs & Accelerators',
    url: 'https://flowstatefounder.ca/',
    blurb:
      "An 11-week accelerator built for women founders — cohorts of just six, landing podcast features, nailing the pitch, and winning grant funding ($850K+ secured) with zero equity taken.",
    location: 'Cohort-based · Vancouver',
  },
  {
    id: 'bcai',
    name: 'BC + AI Ecosystem',
    category: 'Community & Events',
    url: 'https://bc-ai.ca/',
    blurb:
      'Member-supported nonprofit AI community — recurring meetups, working groups and a public-interest voice for responsible, human-centric AI in British Columbia.',
    location: 'Province-wide',
  },
  {
    id: 'northhouse',
    name: 'North House',
    category: 'Spaces & Places',
    url: 'https://www.joinnorthhouse.com/',
    blurb:
      "An 8,000 sq ft founder space in Mount Pleasant operated by League of Innovators — desks, booths, 24/7 access, and a community built around founders who 10x you.",
    location: '111 E 5th Ave · Mount Pleasant',
    lat: 49.266589,
    lng: -123.1022425,
  },
  {
    id: 'frontiercollective',
    name: 'Frontier Collective',
    category: 'Community & Events',
    url: 'https://www.thefrontiercollective.com/',
    blurb:
      'Vancouver-headquartered global innovation platform for frontier tech — the Frontier Summit, Vancity Innovation House and global missions, with $950M+ raised across its network and a key role in landing Web Summit Vancouver.',
    location: 'HQ Vancouver · Operating globally',
  },
  {
    id: 'venturelabs',
    name: 'SFU VentureLabs',
    category: 'Programs & Accelerators',
    url: 'https://venturelabs.ca/',
    blurb:
      "Simon Fraser University's technology accelerator in Harbour Centre — scale-up programs, AccelerateIP, and coworking backed by university research capacity and networks.",
    location: '1200–555 W Hastings St · Downtown',
    lat: 49.2846668,
    lng: -123.1119122,
  },
  {
    id: 'althra',
    name: 'Althra',
    category: 'Programs & Accelerators',
    url: 'https://althra.ca/',
    blurb:
      "Western Canada's full-time, in-person pre-seed incubator — $12.5K day-one investment with up to $50K follow-on, a 24/7 downtown workspace and an investor trip to San Francisco.",
    location: 'Downtown Vancouver',
  },
  {
    id: 'foundersboost',
    name: 'FoundersBoost Vancouver',
    category: 'Programs & Accelerators',
    url: 'https://www.foundersboost.com/programs/vancouver',
    blurb:
      'The Vancouver chapter of a global 6-week pre-accelerator — no equity, no fees. 600+ alumni startups have raised $400M+ and gone on to Y Combinator, Techstars and a16z.',
    location: 'Cohort-based · Vancouver',
  },
  {
    id: 'foundersquest',
    name: "Founder's Quest",
    category: 'Programs & Accelerators',
    url: 'https://foundersquest.ca/',
    blurb:
      'A gamified founder journey built on the Genesis Framework — validate real problems beat by beat, from the Call to Adventure to a launched venture.',
    location: 'Vancouver',
  },
  {
    id: 'alacrity',
    name: 'Alacrity Canada',
    category: 'Programs & Accelerators',
    url: 'https://www.alacritycanada.com',
    blurb:
      'Scale-up programs and investment-readiness support for Canadian technology companies — its APEX program helps BC SMEs break into global markets.',
    location: 'Province-wide · HQ Victoria',
  },
  {
    id: 'cdm',
    name: 'Centre for Digital Media',
    category: 'Learning & Talent',
    url: 'https://thecdm.ca/',
    blurb:
      "Graduate institution on Great Northern Way Campus — the project-based Master of Digital Media program, jointly backed by UBC, SFU, Emily Carr and BCIT, feeding talent and startups into Vancouver's creative district.",
    location: '685 Great Northern Way · False Creek Flats',
    lat: 49.2673151,
    lng: -123.089946,
  },
  {
    id: 'sfusurrey',
    name: 'SFU Surrey',
    category: 'Learning & Talent',
    url: 'https://www.sfu.ca/surrey/about/our-locations/sfu-surrey-plaza.html',
    blurb:
      "SFU's Surrey campus at Central City — the award-winning Bing Thom-designed hub for applied sciences, engineering, business and the Sustainable Energy Engineering school, anchoring one of Canada's fastest-growing city centres.",
    location: '250–13450 102 Ave · Surrey Central',
    lat: 49.1866,
    lng: -122.849,
  },
  {
    id: 'civicinnovationlab',
    name: 'Civic Innovation Lab',
    category: 'Programs & Accelerators',
    url: 'https://civicinnovationlab.ca/',
    blurb:
      'A City of Burnaby × SFU research lab turning civic challenges — climate action, mobility, equity, reconciliation — into community-engaged research projects with real municipal impact.',
    location: 'Christine Sinclair Community Centre · Burnaby',
    lat: 49.2516823,
    lng: -122.9677019,
  },
  {
    id: 'youngguns',
    name: 'Young Guns Studio',
    category: 'Learning & Talent',
    url: 'https://www.ygstudio.ca/',
    blurb:
      "Vancouver's premier art & design institute for ambitious students — portfolio programs and creative-intelligence training that have earned 900+ offers to top universities and $10M+ in scholarships.",
    location: 'Vancouver',
  },
  {
    id: 'vsw',
    name: 'Vancouver Startup Week',
    category: 'Community & Events',
    url: 'https://www.vanstartupweek.ca/',
    blurb:
      "The annual week when BC's whole startup scene shows up — 85+ community-led events, thousands of founders, dreamers and doers, every spring across the city.",
    location: 'Citywide · Annual',
  },
  {
    id: 'womentransformingcities',
    name: 'Women Transforming Cities',
    category: 'Community & Events',
    url: 'https://www.womentransformingcities.org/',
    blurb:
      'Registered charity founded by former Vancouver city councillor Ellen Woodsworth — building civic power for equity-deserving genders through the Our City Hall campaign, Watch Council and advocacy training.',
    location: 'Vancouver',
  },
  {
    id: 'buildrs',
    name: 'buildrs.dev',
    category: 'Community & Events',
    url: 'https://buildrs.dev/',
    blurb:
      'Every tech event in Vancouver on one calendar — plus partner drops, builder signals and a coming directory of every product BC’s buildrs are shipping.',
    location: 'Online · Vancouver',
  },
  {
    id: 'aistartuphub',
    name: 'AI Startup Hub',
    category: 'Community & Events',
    url: 'https://www.linkedin.com/company/ai-startup-hub/',
    blurb:
      'A LinkedIn community connecting AI founders, builders and investors across the region — deal flow, demos and discussion for the local AI scene.',
    location: 'Online · LinkedIn',
  },
  {
    id: 'vtj',
    name: 'Vancouver Tech Journal',
    category: 'Media & Storytelling',
    url: 'https://vantechjournal.com/',
    blurb:
      "The most complete coverage of Vancouver's innovation ecosystem — the Sunday Briefing, Midweek Memo and events reaching 25,000+ readers each week.",
    location: '6060 Silver Dr · Burnaby',
    lat: 49.2279909,
    lng: -123.0027391,
  },
  {
    id: 'mml',
    name: 'Multimodal Media Lab',
    category: 'Media & Storytelling',
    url: 'https://www.themml.ca/',
    blurb:
      'AI film production studio, academy and pipeline tools — multimodal media at the intersection of AI and cinema, made in British Columbia.',
    location: 'British Columbia',
  },
  {
    id: 'vst',
    name: 'Victory Square Technologies',
    category: 'Capital & Venture',
    url: 'https://victorysquare.com/',
    blurb:
      'Publicly traded venture builder (CSE: VST) investing in, developing and supporting companies across digital health, AI, Web3, VR/AR, gaming and climate tech.',
    location: '800–1500 W Georgia St · Coal Harbour',
    lat: 49.2901038,
    lng: -123.1307386,
  },
  {
    id: 'makerlabs',
    name: 'MakerLabs',
    category: 'Spaces & Places',
    url: 'https://www.makerlabs.com/',
    blurb:
      "Vancouver's largest makerspace and fabrication studio — 26,000 sq ft in Strathcona with wood and metal shops, ceramics, CNC routers, laser cutters and a fab team that can build almost anything.",
    location: '780 E Cordova St · Strathcona',
    lat: 49.2818969,
    lng: -123.0875456,
    capabilities: ['laser', 'cnc', '3d-print', 'wood', 'metal', 'ceramics'],
  },
  {
    id: 'makercube',
    name: 'Maker Cube',
    category: 'Spaces & Places',
    url: 'https://makercube.ca/',
    blurb:
      "Langley's premier makerspace — woodworking and welding shops, CNC and laser cutters, 3D printing, a ceramics studio, rentable studio 'cubes' and classes for every skill level.",
    location: '104B–5947 206A St · Langley',
    lat: 49.0889,
    lng: -122.6503,
    capabilities: ['laser', 'cnc', '3d-print', 'wood', 'metal', 'ceramics'],
  },
  {
    id: 'vtl',
    name: 'Vancouver Tool Library',
    category: 'Spaces & Places',
    url: 'https://vancouvertoollibrary.com/',
    blurb:
      "Canada's original tool-lending library — a member-run co-op on the Drive lending 1,700+ tools for home repair, gardening and bike maintenance, plus affordable public workshops.",
    location: '3448 Commercial St · The Drive',
    lat: 49.2536988,
    lng: -123.0678595,
    capabilities: ['wood'],
  },
  {
    id: 'zenmakerlab',
    name: 'Zen Maker Lab',
    category: 'Learning & Talent',
    url: 'https://www.zenmakerlab.com/',
    blurb:
      'North Shore maker lab making technology accessible since 2013 — STEAM programs, camps and after-school clubs in coding, robotics, 3D printing and design for kids, youth and adults.',
    location: '224–125 Victory Ship Way · The Shipyards, North Van',
    lat: 49.30955,
    lng: -123.07851,
    capabilities: ['3d-print', 'laser', 'robotics'],
  },
  {
    id: 'tcglass',
    name: 'Terminal City Glass Co-op',
    category: 'Spaces & Places',
    url: 'https://terminalcityglass.com/',
    blurb:
      "Canada's first non-profit co-operative glass studio — shared furnaces, kilns and cold-working gear plus public classes, keeping an expensive craft accessible in Strathcona.",
    location: '1191 Parker St · Strathcona',
    lat: 49.275975,
    lng: -123.0792044,
    capabilities: ['glass'],
  },
  {
    id: 'inspirationlab',
    name: 'VPL Inspiration Lab',
    category: 'Spaces & Places',
    url: 'https://www.vpl.ca/branches/central/level-3/inspiration-lab',
    blurb:
      "The city's free digital creation space on Level 3 of the Central Library — recording studios, digitization stations, video editing and self-publishing tools, open to everyone.",
    location: '350 W Georgia St · Downtown',
    lat: 49.279659,
    lng: -123.115614,
    capabilities: ['recording', 'digitization'],
  },
  {
    id: 'vivo',
    name: 'VIVO Media Arts',
    category: 'Media & Storytelling',
    url: 'https://www.vivomediaarts.com/',
    blurb:
      'Artist-run media arts centre since 1973 — production studios, equipment access, exhibitions, residencies and the Crista Dahl archive, stewarding five decades of Vancouver media art.',
    location: '2625 Kaslo St · Renfrew-Collingwood',
    lat: 49.2608255,
    lng: -123.0476033,
    capabilities: ['recording'],
  },
  {
    id: 'artsfactory',
    name: 'The Arts Factory',
    category: 'Spaces & Places',
    url: 'https://www.artsfactorysociety.ca/',
    blurb:
      'A 21,000 sq ft cultural hub in a transformed industrial warehouse — affordable studios, workshops and coworking for artists working in sculpture, paint, fabric, wood and ceramics.',
    location: '281 Industrial Ave · Strathcona',
    lat: 49.2704431,
    lng: -123.0990799,
    capabilities: ['wood', 'ceramics'],
  },
  {
    id: 'victoria-makerspace',
    name: 'Victoria Makerspace',
    category: 'Spaces & Places',
    url: 'https://makerspace.ca/',
    blurb:
      "Vancouver Island's member-operated makerspace at the Technology Park — a collaborative workshop where makers of every background share tools, knowledge and 24/7 access.",
    location: '4A–4476 Markham St · Saanich',
    lat: 48.4941015,
    lng: -123.4131897,
    capabilities: ['laser', 'cnc', '3d-print', 'wood', 'metal', 'electronics'],
  },
  {
    id: 'foundedincanada',
    name: 'FoundedIn Canada',
    category: 'Community & Events',
    url: 'https://foundedincanada.com/',
    blurb:
      "Sovereign intelligence infrastructure for Canada's innovation economy — founders, capital, talent, programs and government connected in context by its Arctyk AI, on Canadian models and compute that never leave the country.",
    location: 'Vancouver · Nation-wide',
  },
  {
    id: 'bitdevs',
    name: 'BitDevs Vancouver',
    category: 'Community & Events',
    url: 'https://bitdevs.ca/',
    blurb:
      "Vancouver's chapter of the global BitDevs network — monthly Socratic Seminars where Bitcoin and protocol developers, researchers and the curious dissect the latest in permissionless tech.",
    location: 'Monthly Socratic Seminar · Vancouver',
  },
  {
    id: 'zspace',
    name: 'Z-Space',
    category: 'Spaces & Places',
    url: 'https://z-space.ca/',
    blurb:
      'Non-profit arts and technology society in the historic Odd Fellows Hall — coworking, an event stage, media gallery and café for creative technologists and indie builders.',
    location: '301–505 Hamilton St · Victory Square',
    lat: 49.2819714,
    lng: -123.1114556,
  },
  {
    id: 'makerspace-nanaimo',
    name: 'Makerspace Nanaimo',
    category: 'Spaces & Places',
    url: 'https://makerspacenanaimo.org/',
    blurb:
      "Mid-Island's open community lab since 2013 — workshop, studio and social hub with 24/7 member access, from 3D printing and robotics to woodworking and metal.",
    location: '2221A McGarrigle Rd · Nanaimo',
    lat: 49.1939,
    lng: -123.9834,
    capabilities: ['3d-print', 'wood', 'metal', 'robotics'],
  },
  {
    id: 'zenlaunchpad',
    name: 'Zen LaunchPad',
    category: 'Programs & Accelerators',
    url: 'https://www.zenlaunchpad.com/',
    blurb:
      'North Vancouver venture studio and incubator for robotics, IoT and AR/VR ventures — taking teams from idea to prototype, with Canada Startup Visa access and direct funding.',
    location: 'North Vancouver',
  },
];

export const MAPPED = ASSETS.filter((a) => a.lat !== undefined);

// Curated walking trails through the ecosystem — chained venues, not single stops.
export const PATHWAYS: Pathway[] = [
  {
    id: 'gastown-crawl',
    name: 'The Gastown Founder Crawl',
    blurb:
      'Five rooms, one afternoon: coworking, an incubator, the cypherpunk clubhouse, the national memory bank and the coffee bar where first meetings actually happen.',
    stops: ['friendsquarters', 'launch', 'dctrl', 'internetarchive', 'funk'],
  },
  {
    id: 'maker-mile',
    name: 'The Strathcona Maker Mile',
    blurb:
      'The densest making corridor in BC — hack space to artist clubhouse to 26,000 sq ft of fabrication to a glass furnace to a warehouse of studios, all inside one square mile.',
    stops: ['vhs', 'slice', 'makerlabs', 'tcglass', 'artsfactory'],
  },
  {
    id: 'free-build',
    name: 'The Free-Build Circuit',
    blurb:
      'Zero-budget prototyping: record and digitize free at the library, borrow the tools for a few dollars on the Drive, then show your work at open hack night.',
    stops: ['inspirationlab', 'vtl', 'vhs'],
  },
  {
    id: 'island-run',
    name: 'The Island Maker Run',
    blurb:
      "Vancouver Island's two community labs, one highway apart — Saanich's Technology Park to Nanaimo's 24/7 open workshop.",
    stops: ['victoria-makerspace', 'makerspace-nanaimo'],
  },
];
