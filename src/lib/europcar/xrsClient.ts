import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import prisma from '@/lib/prisma';

export interface XRSConfig {
  callerCode: string;
  password: string;
  endpointUrl?: string;
  sourceFile?: string; // name of the calling route file
  action?: string;     // XRS action name (e.g. "getMultipleRates")
}

export interface XRSResponse {
  [key: string]: any;
}

export async function callXRS(
  xmlRequest: string,
  config: XRSConfig
): Promise<XRSResponse> {
  const url = config.endpointUrl || process.env.XRS_ENDPOINT_URL || 'https://applications-ptn.europcar.com/xrs/resxml';
  const action = config.action || detectAction(xmlRequest);
  const sourceFile = config.sourceFile || 'unknown';

  const payload = new URLSearchParams();
  payload.append('callerCode', config.callerCode);
  payload.append('password', config.password);
  payload.append('XML-Request', xmlRequest);

  console.log(`[XRS] [${action}] → ${url}`);

  const startTime = Date.now();
  let rawResponse = '';
  let httpStatus = 0;
  let hasError = false;
  let parsedData: any = {};

  try {
    const response = await axios.post(url, payload.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 20000,
    });

    httpStatus = response.status;
    rawResponse = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const durationMs = Date.now() - startTime;

    console.log(`[XRS] [${action}] ← HTTP ${httpStatus} (${durationMs}ms)`);

    parsedData = await parseStringPromise(rawResponse, { explicitArray: false });

    const errors = getXRSErrors(parsedData);
    if (errors) {
      console.warn(`[XRS] [${action}] ERRO DE NEGÓCIO:`, JSON.stringify(errors));
      hasError = true;
    }

    // Fire-and-forget: NUNCA bloquear a resposta da API por causa do log
    // Se o Supabase estiver fora, a reserva continua funcionando normalmente
    saveLog({ action, sourceFile, endpoint: url, xmlRequest, xmlResponse: rawResponse, httpStatus, durationMs, hasError })
      .catch(e => console.warn('[XRS] Log não salvo:', e.message));

    return parsedData;

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    httpStatus = error.response?.status || 0;
    rawResponse = error.response?.data || error.message || 'Erro desconhecido';
    hasError = true;

    console.error(`[XRS] [${action}] FALHA:`, error.message);

    // Save error log too
    await saveLog({ action, sourceFile, endpoint: url, xmlRequest, xmlResponse: rawResponse, httpStatus, durationMs, hasError });

    throw new Error('Serviço de Reservas Europcar indisponível. Tente novamente em instantes.');
  }
}

async function saveLog(data: {
  action: string;
  sourceFile: string;
  endpoint: string;
  xmlRequest: string;
  xmlResponse: string;
  httpStatus: number;
  durationMs: number;
  hasError: boolean;
}) {
  try {
    await prisma.logXRS.create({
      data: {
        ...data,
        // backward-compat aliases (old schema had payload/response)
        payload: data.xmlRequest,
        response: data.xmlResponse,
      } as any
    });
  } catch (e) {
    // Never let logging crash the main flow
    console.error('[XRS] Falha ao salvar log:', e);
  }
}

function detectAction(xmlRequest: string): string {
  const match = xmlRequest.match(/<Action>([^<]+)<\/Action>/i);
  if (match) return match[1];
  if (xmlRequest.includes('serviceParameters')) return 'getMultipleRates';
  return 'unknown';
}

function getXRSErrors(parsedData: any): any {
  if (parsedData?.Errors) return parsedData.Errors;
  if (parsedData?.Response?.Errors) return parsedData.Response.Errors;
  if (parsedData?.Envelope?.Body?.Fault) return parsedData.Envelope.Body.Fault;
  return null;
}
