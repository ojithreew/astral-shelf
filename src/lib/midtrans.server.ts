import { createHash } from "crypto";

export function midtransIsProduction() {
  return String(process.env.MIDTRANS_IS_PRODUCTION ?? "").toLowerCase() === "true";
}

export function midtransSnapBaseUrl() {
  return midtransIsProduction()
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";
}

export interface SnapTxParams {
  orderId: string;
  grossAmount: number;
  customer: { first_name?: string; email?: string };
  items: Array<{ id: string; price: number; quantity: number; name: string }>;
}

export async function createSnapTransaction(params: SnapTxParams) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY not configured");
  const auth = Buffer.from(`${serverKey}:`).toString("base64");
  const res = await fetch(`${midtransSnapBaseUrl()}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: params.orderId, gross_amount: params.grossAmount },
      customer_details: params.customer,
      item_details: params.items.map((i) => ({
        id: i.id,
        price: Math.round(i.price),
        quantity: i.quantity,
        name: i.name.slice(0, 50),
      })),
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Midtrans error: ${JSON.stringify(json)}`);
  }
  return json as { token: string; redirect_url: string };
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signature: string,
) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const expected = createHash("sha512")
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest("hex");
  return expected === signature;
}
