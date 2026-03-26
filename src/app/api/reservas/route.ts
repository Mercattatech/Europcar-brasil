import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma';

// Função mock para gerar um Locator de reserva de 8 caracteres
function gerarLocalizador() {
   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
   let result = '';
   for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
   }
   return result;
}

export async function POST(request: Request) {
   try {
      const { bookingData, customerData, paymentData } = await request.json();

      const forwardedFor = request.headers.get("x-forwarded-for");
      const ip = forwardedFor ? forwardedFor.split(',')[0] : 'Desconhecido';
      const session = await getServerSession(authOptions);
      const username = session?.user?.name || session?.user?.email || 'Visitante/Deslogado';
      const logOrigem = `Usuário: ${username} | IP: ${ip}`;

      const merchantOrderId = "ORD" + Date.now(); // Código do pedido pro gateway / banco de dados interno
      
      // ResNumber só é gerado agora se for Balcão ou CC. Se for PIX, será gerado depois pelo polling.
      let resNumber: string | null = paymentData.method !== 'PIX' ? gerarLocalizador() : null;

      const cieloConfig = await prisma.cieloConfig.findFirst();
      if ((paymentData.method === 'PIX' || paymentData.method === 'CREDIT') && (!cieloConfig || !cieloConfig.merchantId || !cieloConfig.merchantKey)) {
         return NextResponse.json({ error: 'Chaves da Cielo não configuradas no Admin. Configure-as antes de testar pagamentos online.' }, { status: 400 });
      }

      // 1. Iniciar transação CIELO baseada no paymentData.method
      let cieloLog = "Não enviou para Cielo (Balcão)";
      let pixData: any = null;
      const CIELO_API_URL = cieloConfig?.isSandbox 
          ? "https://apisandbox.cieloecommerce.cielo.com.br/1/sales/" // Ambiente de Testes
          : "https://api.cieloecommerce.cielo.com.br/1/sales/"; // Produção Real
          
      const cieloHeaders = {
         "Content-Type": "application/json",
         "MerchantId": cieloConfig?.merchantId || '',
         "MerchantKey": cieloConfig?.merchantKey || ''
      };

      if (paymentData.method === 'PIX') {
         // Cielo PIX Real
         const resCielo = await fetch(CIELO_API_URL, {
             method: 'POST',
             headers: cieloHeaders,
             body: JSON.stringify({
                 "MerchantOrderId": merchantOrderId,
                 "Customer": { "Name": customerData.nome + " " + customerData.sobrenome, "Identity": customerData.cpf },
                 "Payment": {
                     "Type": "Pix",
                     "Amount": paymentData.amountInCents
                 }
             })
         });
         const resCieloText = await resCielo.text();
         let cieloResponseJson: any;
         try {
             cieloResponseJson = JSON.parse(resCieloText);
         } catch(e) {
             throw new Error("Sistema Cielo Indisponível ou Resposta Inesperada: HTTP " + resCielo.status + " Corpo: " + resCieloText);
         }
         
         await prisma.logCielo.create({
             data: {
                 endpoint: "POST /1/sales/ (PIX)",
                 payload: JSON.stringify({ amount: paymentData.amountInCents, type: 'Pix' }),
                 response: JSON.stringify(cieloResponseJson)
             }
         });

         if (!resCielo.ok || !cieloResponseJson.Payment || !cieloResponseJson.Payment.QrCodeString) {
             throw new Error("Erro na Cielo ao gerar PIX: " + JSON.stringify(cieloResponseJson));
         }

         cieloLog = "Sucesso PIX Cielo.";
         pixData = {
            qrCodeBase64: cieloResponseJson.Payment.QrCodeBase64Image,
            qrCodeString: cieloResponseJson.Payment.QrCodeString,
            paymentId: cieloResponseJson.Payment.PaymentId
         };

      } else if (paymentData.method === 'CREDIT') {
         // Detectar bandeira basica
         const firstDigit = paymentData.creditCard.number.charAt(0);
         const brand = firstDigit === '4' ? 'Visa' : firstDigit === '5' ? 'Master' : firstDigit === '3' ? 'Amex' : 'Elo';
         
         // Format MM/YYYY
         let validityFormatted = paymentData.creditCard.validity;
         if (validityFormatted.length === 5 && validityFormatted.includes('/')) {
             const [mm, yy] = validityFormatted.split('/');
             validityFormatted = `${mm}/20${yy}`;
         }

         // Cielo Credit Card Real
         const resCielo = await fetch(CIELO_API_URL, {
             method: 'POST',
             headers: cieloHeaders,
             body: JSON.stringify({
                 "MerchantOrderId": merchantOrderId,
                 "Customer": { "Name": customerData.nome + " " + customerData.sobrenome, "Identity": customerData.cpf.replace(/\D/g, '') },
                 "Payment": {
                     "Type": "CreditCard",
                     "Amount": paymentData.amountInCents,
                     "Installments": 1,
                     "Capture": true, // Autoriza e Captura ao mesmo tempo
                     "CreditCard": {
                         "CardNumber": paymentData.creditCard.number.replace(/\D/g, ''),
                         "Holder": paymentData.creditCard.name,
                         "ExpirationDate": validityFormatted,
                         "SecurityCode": paymentData.creditCard.cvv,
                         "Brand": brand
                     }
                 }
             })
         });
         const resCieloText = await resCielo.text();
         let cieloResponseJson: any;
         try {
             cieloResponseJson = JSON.parse(resCieloText);
         } catch(e) {
             throw new Error("Sistema Cielo Indisponível ou Resposta Inesperada: HTTP " + resCielo.status + " Corpo: " + resCieloText);
         }

         await prisma.logCielo.create({
             data: {
                 endpoint: "POST /1/sales/ (CreditCard)",
                 payload: JSON.stringify({ amount: paymentData.amountInCents, type: 'CreditCard' }), // NO PAN/CVV logs here for security!
                 response: JSON.stringify(cieloResponseJson)
             }
         });

         if (!resCielo.ok || (cieloResponseJson.Payment.Status !== 1 && cieloResponseJson.Payment.Status !== 2)) {
             throw new Error("Pagamento Recusado pela Cielo: " + (cieloResponseJson.Payment?.ReturnMessage || JSON.stringify(cieloResponseJson)));
         }

         cieloLog = "Sucesso Cartão Cielo: " + cieloResponseJson.Payment.ReturnMessage;
      }

      // 2. Salva a reserva no banco de dados "LocalReservation"
      const localRes = await prisma.localReservation.create({
         data: {
            resNumber: resNumber,
            merchantOrderId,
            status: paymentData.method === 'PIX' ? 'PENDING_PIX' : (paymentData.method === 'BALCAO' ? 'CONFIRMED_NON_PREPAID' : 'CONFIRMED_PREPAID'),
            customerData: JSON.stringify({ ...customerData, booking: bookingData, paymentId: pixData?.paymentId, systemLogOrigem: logOrigem })
         }
      });

      return NextResponse.json({
         success: true,
         resNumber: localRes.resNumber,
         merchantOrderId: localRes.merchantOrderId,
         pixData,
         cieloLog: `${cieloLog} | ${logOrigem}`
      });

   } catch (error: any) {
      console.error(error);
      return NextResponse.json({ error: 'Erro ao processar reserva: ' + error.message }, { status: 500 });
   }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resNumber = searchParams.get('resNumber');

  if (!resNumber) {
     return NextResponse.json({ error: 'resNumber is required' }, { status: 400 });
  }

  try {
     const reservaLocal = await prisma.localReservation.findUnique({
         where: { resNumber }
     });

     if (!reservaLocal) {
         return NextResponse.json({ error: 'Reserva não encontrada no banco local' }, { status: 404 });
     }

     return NextResponse.json(reservaLocal);
  } catch (error: any) {
     return NextResponse.json({ error: 'Erro ao buscar reserva local' }, { status: 500 });
  }
}
