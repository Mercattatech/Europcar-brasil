import axios from 'axios';

export interface CieloConfig {
  merchantId: string;
  merchantKey: string;
  environment?: 'sandbox' | 'production';
}

export interface CustomerData {
  Name: string;
  Email?: string;
  Identity?: string; // CPF
  IdentityType?: string; // "CPF"
  Address?: {
    Street: string;
    Number: string;
    Complement?: string;
    ZipCode: string;
    City: string;
    State: string;
    Country: string;
  };
}

export interface CreditCardTokenRequest {
  CustomerName: string;
  CardNumber: string; // PAN
  Holder: string;
  ExpirationDate: string; // MM/YYYY
  Brand: string;
}

export async function createCreditCardToken(
  requestData: CreditCardTokenRequest,
  config: CieloConfig
) {
  const isSandbox = config.environment !== 'production';
  const url = isSandbox
    ? 'https://apiquerysandbox.cieloecommerce.cielo.com.br/1/card'
    : 'https://api.cieloecommerce.cielo.com.br/1/card';

  // 1. REGRA DE OURO: O dado real do Cartão (PAN) nunca deve ser logado pelo sistema, 
  // e será mantido pela Cielo.
  console.log(`[LogsCielo] [INFO] Solicitando Tokenização de Cartão (Zero Auth) para titular: ${requestData.Holder}`);

  try {
    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'MerchantId': config.merchantId,
        'MerchantKey': config.merchantKey
      },
      timeout: 10000,
    });

    console.log(`[LogsCielo] [SUCCESS] Token gerado com sucesso: ${response.data.CardToken}`);
    return response.data; // Retorna o CardToken que será utilizado em transações futuras.
  } catch (error: any) {
    console.error(`[LogsCielo] [ERROR] Falha na tokenização Cielo:`, error.message);
    if (error.response) {
      console.error(`[LogsCielo] [ERROR DETAILS]:`, JSON.stringify(error.response.data));
    }
    throw new Error('Não foi possível validar o cartão de crédito.');
  }
}

export async function processPaymentWithToken(
  amountInCents: number,
  cardToken: string,
  customerData: CustomerData,
  merchantOrderId: string, // UUID nosso
  config: CieloConfig
) {
  const isSandbox = config.environment !== 'production';
  const url = isSandbox
    ? 'https://apisandbox.cieloecommerce.cielo.com.br/1/sales'
    : 'https://api.cieloecommerce.cielo.com.br/1/sales';

  // O Payload transacional Antifraude/3DS requer os dados do Customer
  const payload = {
    MerchantOrderId: merchantOrderId,
    Customer: customerData,
    Payment: {
      Type: 'CreditCard',
      Amount: amountInCents, // Regra Ouro 3.0: Valor sempre em centavos R$ 50,00 -> 5000
      Installments: 1, // À vista
      SoftDescriptor: 'EUROPCAR', // Regra Ouro 3.0: Fatura amigável
      CreditCard: {
        CardToken: cardToken,
      },
    },
  };

  console.log(`[LogsCielo] [INFO] Processando Pagamento Card-on-File. Pedido: ${merchantOrderId}, Valor (centavos): ${amountInCents}`);

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'MerchantId': config.merchantId,
        'MerchantKey': config.merchantKey
      },
      timeout: 20000,
    });

    console.log(`[LogsCielo] [SUCCESS] Transação processada. Status: ${response.data.Payment.Status}`);
    return response.data;
  } catch (error: any) {
     console.error(`[LogsCielo] [ERROR] Falha no pagamento Cielo:`, error.message);
     if (error.response) {
       console.error(`[LogsCielo] [ERROR DETAILS]:`, JSON.stringify(error.response.data));
     }
     throw new Error('Transação financeira recusada ou falhou.');
  }
}
