/**
 * PayHere Sri Lanka payment integration.
 * Generates checkout params and verifies webhook signature (HMAC-SHA1).
 */

import { createHmac, createHash } from "crypto";

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID ?? "";
const PAYHERE_SECRET = process.env.PAYHERE_SECRET ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export interface PayHereCheckoutParams {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  hash: string;
}

/**
 * Build PayHere checkout URL and params for redirect.
 * Hash = MD5(merchant_id + order_id + amount + currency + merchant_secret)
 * PayHere doc may use different hash algorithm - adjust if needed.
 */
export function buildPayHereCheckout(
  orderId: string,
  orderNumber: string,
  amountLKR: number,
  customerName: string,
  phone: string
): { url: string; params: PayHereCheckoutParams } {
  const amountStr = amountLKR.toFixed(2);
  const currency = "LKR";
  const secretMd5 = createHash("md5").update(PAYHERE_SECRET).digest("hex").toUpperCase();
  const hashInput = `${MERCHANT_ID}${orderId}${amountStr}${currency}${secretMd5}`;
  const hash = createHash("md5").update(hashInput).digest("hex").toUpperCase();

  const params: PayHereCheckoutParams = {
    merchant_id: MERCHANT_ID,
    return_url: `${APP_URL}/order/${orderId}?success=1`,
    cancel_url: `${APP_URL}/checkout?cancelled=1`,
    notify_url: `${APP_URL}/api/payhere/webhook`,
    order_id: orderId,
    items: `Order ${orderNumber}`,
    amount: amountStr,
    currency,
    first_name: customerName.split(" ")[0] ?? customerName,
    last_name: customerName.split(" ").slice(1).join(" ") || ".",
    phone,
    hash,
  };

  const baseUrl = "https://www.payhere.lk/pay";
  const search = new URLSearchParams(
    Object.entries(params).reduce(
      (acc, [k, v]) => ({ ...acc, [k]: String(v ?? "") }),
      {} as Record<string, string>
    )
  );
  const url = `${baseUrl}?${search.toString()}`;
  return { url, params };
}

/**
 * Verify PayHere webhook signature (X-Signature header).
 * PayHere signs with HMAC-SHA1 of the raw body using merchant secret.
 */
export function verifyPayHereWebhook(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature || !PAYHERE_SECRET) return false;
  const expected = createHmac("sha1", PAYHERE_SECRET)
    .update(rawBody)
    .digest("hex");
  return signature === expected;
}
