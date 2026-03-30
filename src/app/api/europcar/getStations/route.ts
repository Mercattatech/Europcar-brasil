import { NextResponse } from 'next/server';

// ⚠️ SANDBOX: estações brasileiras estão sendo habilitadas pela Europcar.
// ROMC04 = Bucareste (Romênia) — disponível para teste no CallerCode 1132581.
// Quando as estações BR forem habilitadas, remover ROMC04.
const STATIONS_MOCK = [
   // === TESTE SANDBOX ===
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
     lng: 26.1025
   },
   // === BRASIL (aguardando habilitação pela Europcar) ===
   {
     code: 'GRUT01',
     name: 'GUARULHOS AIRPORT MEET AND GREET',
     city: 'Guarulhos',
     country: 'BRAZIL',
     type: 'airport',
     address: 'AV LAURO DE GUSMAO VIEIRA 1125\n07140 010 SAO PAULO\nBRAZIL',
     features: ['Devolução 24/7', 'Retirada fora do horário de funcionamento'],
     hours: [
        { day: 'SEG', hours: '06:00 - 22:00\n22:01 - 23:30*' },
        { day: 'TER', hours: '06:00 - 22:00\n22:01 - 23:30*' },
        { day: 'QUA', hours: '06:00 - 22:00\n22:01 - 23:30*' },
        { day: 'QUI', hours: '06:00 - 22:00' },
     ],
     lat: -23.4287,
     lng: -46.4735
   },
   {
     code: 'CGHT01',
     name: 'GUARULHOS DOWNTOWN',
     city: 'Guarulhos',
     country: 'BRAZIL',
     type: 'downtown',
     address: 'Av. Tiradentes, 1234\nGuarulhos, SP\nBRAZIL',
     features: [],
     hours: [
        { day: 'SEG', hours: '08:00 - 18:00' },
        { day: 'TER', hours: '08:00 - 18:00' },
     ],
     lat: -23.4699,
     lng: -46.5283
   },
   { code: 'VCPT01', name: 'CAMPINAS VIRACOPOS AIRPORT', city: 'Campinas', country: 'BRAZIL', type: 'airport', address: 'Rodovia Santos Dumont', features: [], hours: [] },
   { code: 'GIGT01', name: 'RIO DE JANEIRO GALEAO AIRPORT', city: 'Rio de Janeiro', country: 'BRAZIL', type: 'airport', address: 'Av. Vinte de Janeiro', features: [], hours: [] },
   { code: 'SDUT01', name: 'RIO DE JANEIRO DOWNTOWN', city: 'Rio de Janeiro', country: 'BRAZIL', type: 'downtown', address: 'Praça Senador Salgado Filho', features: [], hours: [] },
];

export async function GET(request: Request) {
  try {
     const { searchParams } = new URL(request.url);
     const q = searchParams.get('q');
     
     let results = STATIONS_MOCK;
     
     if (q) {
         const lowerQ = q.toLowerCase();
         results = STATIONS_MOCK.filter(s => 
            s.name.toLowerCase().includes(lowerQ) || 
            s.city.toLowerCase().includes(lowerQ) ||
            s.code.toLowerCase().includes(lowerQ)
         );
     }
     
     return NextResponse.json({ stations: results });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao consultar XRS getStations' },
      { status: 500 }
    );
  }
}
