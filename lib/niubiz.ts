/**
 * Cliente servidor de Niubiz (Botón de Pago Web).
 *
 * Flujo oficial:
 *  1) Token de seguridad  (Basic usuario:clave)            -> POST api.security
 *  2) Token de sesión     (monto + datos antifraude)       -> POST api.ecommerce/token/session/{merchantId}
 *  3) Formulario Niubiz (checkout.js) captura la tarjeta en el navegador (PCI lo cubre Niubiz)
 *  4) Autorización        (transactionToken del form)      -> POST api.authorization/ecommerce/{merchantId}
 *
 * IMPORTANTE: este módulo SOLO debe importarse desde código de servidor
 * (server actions / route handlers). Las credenciales nunca viajan al navegador.
 */

const ENDPOINTS = {
  sandbox: {
    security: "https://apisandbox.vnforappstest.com/api.security/v1/security",
    session: "https://apisandbox.vnforappstest.com/api.ecommerce/v2/ecommerce/token/session/",
    authorization: "https://apisandbox.vnforappstest.com/api.authorization/v3/authorization/ecommerce/",
    script: "https://static-content-qas.vnforapps.com/env/sandbox/js/checkout.js",
  },
  production: {
    security: "https://apiprod.vnforapps.com/api.security/v1/security",
    session: "https://apiprod.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/",
    authorization: "https://apiprod.vnforapps.com/api.authorization/v3/authorization/ecommerce/",
    script: "https://static-content.vnforapps.com/v2/js/checkout.js",
  },
} as const;

/** Niubiz exige purchaseNumber numérico (máx. 12 dígitos). Se deriva del id del intento. */
const PURCHASE_NUMBER_OFFSET = 100000;
export const toPurchaseNumber = (attemptId: number) => String(attemptId + PURCHASE_NUMBER_OFFSET);
export const fromPurchaseNumber = (purchaseNumber: string) => Number(purchaseNumber) - PURCHASE_NUMBER_OFFSET;

export class NiubizError extends Error {
  constructor(message: string, public readonly step: "config" | "security" | "session" | "authorization", public readonly detail?: unknown) {
    super(message);
    this.name = "NiubizError";
  }
}

function getConfig() {
  const env: "sandbox" | "production" = process.env.NIUBIZ_ENV === "production" ? "production" : "sandbox";
  const merchantId = process.env.NIUBIZ_MERCHANT_ID;
  const user = process.env.NIUBIZ_USER;
  const password = process.env.NIUBIZ_PASSWORD;
  if (!merchantId || !user || !password) {
    throw new NiubizError(
      "Niubiz no está configurado (NIUBIZ_MERCHANT_ID / NIUBIZ_USER / NIUBIZ_PASSWORD).",
      "config"
    );
  }
  return { env, merchantId, user, password, urls: ENDPOINTS[env] };
}

export function isNiubizConfigured() {
  return Boolean(process.env.NIUBIZ_MERCHANT_ID && process.env.NIUBIZ_USER && process.env.NIUBIZ_PASSWORD);
}

// El token de seguridad dura ~1 hora: lo reutilizamos 30 min para no pedirlo en cada pago.
let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getSecurityToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const { user, password, urls } = getConfig();
  const res = await fetch(urls.security, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${user}:${password}`).toString("base64"), Accept: "*/*" },
    cache: "no-store",
  });
  if (!res.ok) throw new NiubizError(`Niubiz seguridad respondió ${res.status}`, "security");

  const token = (await res.text()).trim();
  if (!token) throw new NiubizError("Niubiz no devolvió token de seguridad", "security");
  cachedToken = { value: token, expiresAt: Date.now() + 30 * 60 * 1000 };
  return token;
}

export type SessionInput = {
  amount: number;
  email: string;
  customerId: string;
  isRegistered: boolean;
  /** Días desde que el cliente se registró (antifraude MDD77) */
  daysSinceRegistered: number;
  clientIp: string;
};

export type NiubizSession = {
  sessionToken: string;
  merchantId: string;
  scriptUrl: string;
  environment: "sandbox" | "production";
};

export async function createSessionToken(input: SessionInput): Promise<NiubizSession> {
  const { merchantId, urls, env } = getConfig();
  const token = await getSecurityToken();

  const res = await fetch(urls.session + merchantId, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({
      channel: "web",
      amount: Number(input.amount.toFixed(2)),
      antifraud: {
        clientIp: input.clientIp,
        merchantDefineData: {
          MDD4: input.email,
          MDD21: input.isRegistered ? 1 : 0,
          MDD32: input.customerId,
          MDD75: input.isRegistered ? "Registrado" : "Invitado",
          MDD77: Math.max(0, Math.floor(input.daysSinceRegistered)),
        },
      },
    }),
    cache: "no-store",
  });

  // 401 = token vencido: reintentamos una vez con token nuevo
  if (res.status === 401) {
    await getSecurityToken(true);
    return createSessionToken(input);
  }
  if (!res.ok) throw new NiubizError(`Niubiz sesión respondió ${res.status}`, "session", await safeText(res));

  const data = await res.json();
  if (!data?.sessionKey) throw new NiubizError("Niubiz no devolvió sessionKey", "session", data);

  return { sessionToken: data.sessionKey, merchantId, scriptUrl: urls.script, environment: env };
}

export type AuthorizationResult = {
  approved: boolean;
  actionCode: string | null;
  transactionId: string | null;
  authorizationCode: string | null;
  message: string;
  /** Subconjunto NO sensible de la respuesta, para auditoría (nunca el número completo de tarjeta) */
  audit: Record<string, unknown>;
};

export async function authorizeTransaction(params: {
  transactionToken: string;
  purchaseNumber: string;
  amount: number;
}): Promise<AuthorizationResult> {
  const { merchantId, urls } = getConfig();
  const token = await getSecurityToken();

  const res = await fetch(urls.authorization + merchantId, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({
      channel: "web",
      captureType: "manual",
      countable: true,
      order: {
        tokenId: params.transactionToken,
        purchaseNumber: params.purchaseNumber,
        amount: Number(params.amount.toFixed(2)),
        currency: "PEN",
      },
    }),
    cache: "no-store",
  });

  let body: { dataMap?: Record<string, any>; data?: Record<string, any>; order?: Record<string, any>; [key: string]: any } | null = null;
  try {
    body = await res.json();
  } catch {
    throw new NiubizError(`Niubiz autorización respondió ${res.status} sin JSON`, "authorization");
  }

  return normalizeAuthorization(res.ok, body || {});
}

/** Interpreta la respuesta de Niubiz (aprobada = HTTP ok + ACTION_CODE "000"). Exportada para tests. */
export function normalizeAuthorization(httpOk: boolean, body: { dataMap?: Record<string, any>; data?: Record<string, any>; order?: Record<string, any>; [key: string]: any }): AuthorizationResult {
  const dataMap = body?.dataMap ?? body?.data ?? {};
  const actionCode: string | null = dataMap.ACTION_CODE ?? body?.order?.actionCode ?? null;
  const approved = httpOk && actionCode === "000";

  return {
    approved,
    actionCode,
    transactionId: dataMap.TRANSACTION_ID ?? body?.order?.transactionId ?? null,
    authorizationCode: dataMap.AUTHORIZATION_CODE ?? body?.order?.authorizationCode ?? null,
    message: approved
      ? "Autorizado"
      : dataMap.ACTION_DESCRIPTION ?? body?.errorMessage ?? "Operación denegada",
    audit: {
      STATUS: dataMap.STATUS,
      ACTION_CODE: actionCode,
      ACTION_DESCRIPTION: dataMap.ACTION_DESCRIPTION,
      BRAND: dataMap.BRAND,
      CARD: dataMap.CARD, // ya viene enmascarada (ej. 4551 70******0000)
      TRANSACTION_ID: dataMap.TRANSACTION_ID,
      AUTHORIZATION_CODE: dataMap.AUTHORIZATION_CODE,
      errorCode: body?.errorCode,
    },
  };
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}
