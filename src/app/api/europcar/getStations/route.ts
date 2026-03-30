import { NextResponse } from 'next/server';
import { getStations } from '@/lib/europcar/xrsClient';

// Fallback mock data (used only if XRS call fails)
const STATIONS_MOCK = [
  {
    code: 'ROMC04',
    name: '[SANDBOX] Bucareste — Teste XRS',
    city: 'Bucareste (Teste)',
    country: 'ROMÊNIA',
    type: 'airport',
    address: 'Estação de teste — CallerCode 1132581',
    features: ['Estação sandbox', 'Teste de reservas'],
    hours: [{ day: 'SEG-DOM', hours: '00:00 - 23:59' }],
    lat: 44.4268,
    lng: 26.1025,
  },
  // ... other mock stations (including Brazilian ones) as previously defined
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();

  let stations = [] as any[];
  try {
    // Fetch real stations from XRS (Brazil)
    stations = await getStations('BR');

  } catch (error) {
    console.error('Failed to fetch stations from XRS, falling back to mock:', error);
    stations = STATIONS_MOCK;
  }

  // Apply fuzzy filter if query provided
  const filtered = q
    ? stations.filter((s) => {
        const term = q;
        return (
          (s.stationCode ?? s.code ?? '').toLowerCase().includes(term) ||
          (s.stationName ?? s.name ?? '').toLowerCase().includes(term) ||
          (s.city ?? '').toLowerCase().includes(term)
        );
      })
    : stations;

  // Shape payload for frontend autocomplete component
  const payload = filtered.map((s) => ({
    code: s.stationCode ?? s.code,
    name: s.stationName ?? s.name,
    city: s.city ?? '',
    type: s.prestige === 'Y' ? 'airport' : s.type ?? 'city',
    address: s.address1 ?? s.address ?? '',
    features: s.features ?? [],
    hours: s.hours ?? [],
  }));

  return NextResponse.json({ stations: payload });
}
