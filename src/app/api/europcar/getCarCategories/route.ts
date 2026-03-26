import { NextResponse } from 'next/server';
import { callXRS } from '@/lib/europcar/xrsClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pickupStation, pickupDate, pickupTime, returnStation, returnDate, returnTime } = body;

    const xmlRequest = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Request>
        <Action>getCarCategories</Action>
        <Pickup>
           <StationCode>${pickupStation}</StationCode>
           <Date>${pickupDate}</Date>
           <Time>${pickupTime}</Time>
        </Pickup>
        <Return>
           <StationCode>${returnStation || pickupStation}</StationCode>
           <Date>${returnDate}</Date>
           <Time>${returnTime}</Time>
        </Return>
      </Request>
    `.trim();

    const mockConfig = { callerCode: process.env.XRS_CALLER_CODE || 'DEMO', password: process.env.XRS_PASSWORD || 'DEMO', action: 'getCarCategories', sourceFile: 'getCarCategories/route.ts' };

    const xrsResponse = await callXRS(xmlRequest, mockConfig);

    // DICA DO PROFESSOR APLICADA:
    // "Extraia os códigos ACRISS (ex: ECMR)"
    // O retorno dessa API será parseado no frontend para montar o grid da Vitrine "Nossa Frota".
    
    return NextResponse.json(xrsResponse);

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao consultar XRS getCarCategories' },
      { status: 500 }
    );
  }
}
