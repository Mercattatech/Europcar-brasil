import { NextResponse } from 'next/server';
import { callXRS } from '@/lib/europcar/xrsClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pickupStation, returnStation, pickupDate, returnDate, pickupTime, returnTime, acrissCodes, contractID } = body;
    
    if (!acrissCodes || !Array.isArray(acrissCodes)) {
        return NextResponse.json({ error: 'acrissCodes precisa ser um array' }, { status: 400 });
    }
    
    const chunks = [];
    for (let i = 0; i < acrissCodes.length; i += 10) {
        chunks.push(acrissCodes.slice(i, i + 10));
    }

    const mockConfig = { callerCode: process.env.XRS_CALLER_CODE || 'DEMO', password: process.env.XRS_PASSWORD || 'DEMO', action: 'getMultipleRates', sourceFile: 'getMultipleRates/route.ts' };
    
    // Build contractID attribute for <reservation> tag if present
    const contractAttr = contractID ? ` contractID="${contractID}" type="C"` : '';
    
    const promises = chunks.map(chunk => {
        const carCategoryPattern = chunk.join(',');
        
        const xmlRequest = `
          <?xml version="1.0" encoding="UTF-8"?>
          <serviceParameters>
            <reservation carCategory="${carCategoryPattern}"${contractAttr}>
              <checkout stationID="${pickupStation}" date="${pickupDate}" time="${pickupTime || '0900'}" />
              <checkin stationID="${returnStation || pickupStation}" date="${returnDate}" time="${returnTime || '0900'}" />
            </reservation>
          </serviceParameters>
        `.trim();
        
        return callXRS(xmlRequest, mockConfig);
    });

    const results = await Promise.all(promises);
    
    const combinedRates = results.reduce((acc, curr) => {
        return { ...acc, ...curr }; 
    }, {});

    return NextResponse.json({ combinedRates });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao consultar XRS getMultipleRates' },
      { status: 500 }
    );
  }
}
