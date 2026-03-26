import { NextResponse } from 'next/server';
import { callXRS } from '@/lib/europcar/xrsClient';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rateId, acrissCategory, driverData, paymentData, contractID } = body;
    
    // Build contractID attribute injection if promo is active
    const contractAttr = contractID ? ` contractID="${contractID}" type="C"` : '';
    
    const xmlRequest = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Request>
        <Action>bookReservation</Action>
        <RateId>${rateId}</RateId>
        <CarCategory${contractAttr}>${acrissCategory}</CarCategory>
        
        <Payment>
           <PrepaidMode>NP</PrepaidMode>
           <MeanOfPayment TypeCode="CC">
             <!-- Se o cartão foi processado via Cielo, apenas confirmamos reserva -->
           </MeanOfPayment>
        </Payment>
        
        <Driver>
            <FirstName>${driverData.firstName}</FirstName>
            <LastName>${driverData.lastName}</LastName>
            <Email>${driverData.email}</Email>
        </Driver>
      </Request>
    `.trim();

    const mockConfig = { callerCode: process.env.XRS_CALLER_CODE || 'DEMO', password: process.env.XRS_PASSWORD || 'DEMO', action: 'bookReservation', sourceFile: 'bookReservation/route.ts' };
    
    const xrsResponse = await callXRS(xmlRequest, mockConfig);

    const resNumber = xrsResponse?.Response?.ReservationNumber || xrsResponse?.resNumber || 'SIMULADO_123';

    await prisma.localReservation.create({
        data: {
          resNumber: resNumber,
          merchantOrderId: paymentData.merchantOrderId || 'SIMULADO_ORDER_ID',
          customerData: JSON.stringify({
            ...driverData,
            contractID: contractID || null  // Track which promo was used
          }),
          status: paymentData.paid ? 'CONFIRMED_PREPAID' : 'CONFIRMED_NON_PREPAID'
        }
    });

    return NextResponse.json({ 
       success: true, 
       resNumber, 
       message: 'Reserva concluída com sucesso' 
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao consultar XRS bookReservation' },
      { status: 500 }
    );
  }
}
