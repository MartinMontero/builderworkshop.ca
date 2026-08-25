// Canonical entity data comes from the site's open dataset, never from the
// search index. Retrieval hands us item keys ("<id>.md"); everything the
// response shows — name, category, stages, URL — is joined here.

export interface EcosystemEntry {
  id: string;
  name: string;
  category: string;
  stages: string[];
  url: string;
  location?: string;
  verified?: string; // YYYY-MM, present once the site exports it
}

export interface EcosystemData {
  byId: Map<string, EcosystemEntry>;
  byUrl: Map<string, EcosystemEntry>;
  names: string[];
  categories: string[];
  stages: string[];
  players: EcosystemEntry[];
}

export const ECOSYSTEM_URL = 'https://builderworkshop.ca/ecosystem.json';
const TTL_MS = 5 * 60 * 1000;

export function indexEcosystem(raw: {
  players?: Array<{
    id: string;
    name: string;
    category: string;
    stages: string[];
    url: string;
    location?: string;
    verified?: string;
  }>;
  categories?: string[];
  stages?: string[];
}): EcosystemData {
  const players = raw.players ?? [];
  if (players.length === 0) {
    throw new Error('ecosystem.json contains no players — refusing to serve');
  }
  const byId = new Map<string, EcosystemEntry>();
  const byUrl = new Map<string, EcosystemEntry>();
  const entries: EcosystemEntry[] = [];
  for (const p of players) {
    const entry: EcosystemEntry = {
      id: p.id,
      name: p.name,
      category: p.category,
      stages: p.stages ?? [],
      url: p.url,
      location: p.location,
      verified: p.verified,
    };
    entries.push(entry);
    byId.set(p.id, entry);
    byUrl.set(p.url, entry);
  }
  return {
    byId,
    byUrl,
    names: players.map((p) => p.name),
    categories: raw.categories ?? [],
    stages: raw.stages ?? [],
    players: entries,
  };
}

// "<id>.md" → entry. Missing keys are a contract violation between the index
// and the dataset — fail loudly, never guess.
export function resolveKey(eco: EcosystemData, key: string): EcosystemEntry {
  const id = key.replace(/\.md$/, '');
  const entry = eco.byId.get(id);
  if (!entry) {
    throw new Error(`retrieved key "${key}" has no entry in ecosystem.json — index and dataset are out of sync`);
  }
  return entry;
}

// Pathway docs are indexed for retrieval but have no outbound URL — they can
// never be a structured result. Everything else must resolve or we fail loudly.
export function isJoinableKey(key: string): boolean {
  return !key.startsWith('pathway-');
}

let cache: { data: EcosystemData; at: number } | null = null;

export async function loadEcosystem(fetcher: typeof fetch = fetch): Promise<EcosystemData> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const res = await fetcher(ECOSYSTEM_URL);
  if (!res.ok) {
    if (cache) return cache.data; // stale beats down
    throw new Error(`ecosystem.json fetch failed: ${res.status}`);
  }
  const data = indexEcosystem(await res.json());
  cache = { data, at: Date.now() };
  return data;
}
