import { NextResponse } from 'next/server';
import { callXRS } from '@/lib/europcar/xrsClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rateId, pickupStation, date, time, contractID } = body;

    if (!rateId) {
        return NextResponse.json({ error: 'rateId é obrigatório' }, { status: 400 });
    }

    // Build contractID injection for the XML if a promotion contract is active
    const contractNode = contractID 
      ? `<ContractID>${contractID}</ContractID>\n        <ContractType>C</ContractType>` 
      : '';

    const xmlRequest = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Request>
        <Action>getQuote</Action>
        <ChargesDetail>TRE</ChargesDetail>
        <RateId>${rateId}</RateId>
        ${contractNode}
        <Pickup>
           <StationCode>${pickupStation}</StationCode>
           <Date>${date}</Date>
           <Time>${time}</Time>
        </Pickup>
      </Request>
    `.trim();

    const mockConfig = { callerCode: process.env.XRS_CALLER_CODE || 'DEMO', password: process.env.XRS_PASSWORD || 'DEMO', action: 'getQuote', sourceFile: 'getQuote/route.ts' };

    const xrsResponse = await callXRS(xmlRequest, mockConfig);

    return NextResponse.json(xrsResponse);

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao consultar XRS getQuote' },
      { status: 500 }
    );
  }
}
