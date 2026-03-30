import { NextResponse } from 'next/server';
import { getStations } from '@/lib/europcar/xrsClient';
export const dynamic = 'force-dynamic';

// In-memory cache: { key: countryCode, value: { stations, timestamp } }
const stationsCache: Record<string, { stations: any[]; ts: number }> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Main countries available in the Europcar network
const ALL_COUNTRIES = [
  'BR', // Brasil
  'AR', // Argentina
  'US', // Estados Unidos
  'CA', // Canadá
  'MX', // México
  'FR', // França
  'DE', // Alemanha
  'ES', // Espanha
  'IT', // Itália
  'GB', // Reino Unido
  'PT', // Portugal
  'BE', // Bélgica
  'NL', // Países Baixos
  'CH', // Suíça
  'AT', // Áustria
  'IE', // Irlanda
  'GR', // Grécia
  'HR', // Croácia
  'CZ', // República Checa
  'DK', // Dinamarca
  'FI', // Finlândia
  'HU', // Hungria
  'NO', // Noruega
  'PL', // Polônia
  'RO', // Romênia
  'SE', // Suécia
  'TR', // Turquia
  'BG', // Bulgária
  'IS', // Islândia
  'AU', // Austrália
  'NZ', // Nova Zelândia
];

// Country name lookup for display
const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brasil', AR: 'Argentina', US: 'Estados Unidos', CA: 'Canadá', MX: 'México',
  FR: 'França', DE: 'Alemanha', ES: 'Espanha', IT: 'Itália', GB: 'Reino Unido',
  PT: 'Portugal', BE: 'Bélgica', NL: 'Países Baixos', CH: 'Suíça', AT: 'Áustria',
  IE: 'Irlanda', GR: 'Grécia', HR: 'Croácia', CZ: 'Rep. Checa', DK: 'Dinamarca',
  FI: 'Finlândia', HU: 'Hungria', NO: 'Noruega', PL: 'Polônia', RO: 'Romênia',
  SE: 'Suécia', TR: 'Turquia', BG: 'Bulgária', IS: 'Islândia', AU: 'Austrália',
  NZ: 'Nova Zelândia',
};

/**
 * Fetch stations for a single country, using in-memory cache.
 */
async function getCachedStations(countryCode: string): Promise<any[]> {
  const cached = stationsCache[countryCode];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.stations;
  }

  try {
    const stations = await getStations(countryCode);
    // Tag each station with its country code
    const tagged = stations.map(s => ({ ...s, countryCode }));
    stationsCache[countryCode] = { stations: tagged, ts: Date.now() };
    return tagged;
  } catch (e) {
    console.error(`[getStations] Falha para ${countryCode}:`, e);
    return cached?.stations || []; // Return stale cache if available
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const countryParam = searchParams.get('country')?.toUpperCase();

  if (!q || q.length < 2) {
    return NextResponse.json({ stations: [] });
  }

  let allStations: any[] = [];

  if (countryParam && countryParam !== 'ALL') {
    // Single country search
    allStations = await getCachedStations(countryParam);
  } else {
    // Priority: always include Brazil first (fast)
    allStations = await getCachedStations('BR');

    // Include other countries that are already cached (instant)
    for (const cc of ALL_COUNTRIES) {
      if (cc === 'BR') continue;
      const cached = stationsCache[cc];
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        allStations.push(...cached.stations);
      }
    }

    // Trigger background pre-warm for uncached countries (fire-and-forget)
    const uncached = ALL_COUNTRIES.filter(cc => {
      const c = stationsCache[cc];
      return !c || Date.now() - c.ts >= CACHE_TTL_MS;
    });
    if (uncached.length > 0) {
      // Don't await — populate cache for next searches
      Promise.all(uncached.slice(0, 10).map(c => getCachedStations(c))).catch(() => {});
    }
  }

  // Apply text filter
  const filtered = allStations.filter((s) => {
    const code = (s.stationCode ?? s.code ?? '').toLowerCase();
    const name = (s.stationName ?? s.name ?? '').toLowerCase();
    const city = (s.cityName ?? s.city ?? '').toLowerCase();
    const country = (COUNTRY_NAMES[s.countryCode] ?? '').toLowerCase();
    return code.includes(q) || name.includes(q) || city.includes(q) || country.includes(q);
  });

  // Limit results for performance
  const limited = filtered.slice(0, 30);

  // Shape payload for frontend autocomplete
  const payload = limited.map((s) => ({
    code: s.stationCode ?? s.code,
    name: s.stationName ?? s.name,
    city: s.cityName ?? s.city ?? '',
    country: COUNTRY_NAMES[s.countryCode] ?? s.countryCode ?? '',
    countryCode: s.countryCode ?? '',
    type: s.prestige === 'Y' ? 'airport' : s.type ?? 'city',
    address: s.address1 ?? s.address ?? '',
    features: s.features ?? [],
    hours: s.hours ?? [],
  }));

  return NextResponse.json({ stations: payload });
}
