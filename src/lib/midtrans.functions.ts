import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { createSnapTransaction, midtransIsProduction } from "./midtrans.server";

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export const getMidtransConfig = createServerFn({ method: "GET" }).handler(async () => {
  return {
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
    isProduction: midtransIsProduction(),
  };
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      items: z.array(z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      })).min(1).max(50),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const sb = adminClient();

    // Fetch products
    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await sb
      .from("products")
      .select("id, name, price, slug")
      .in("id", ids)
      .eq("is_published", true);
    if (pErr) throw new Error(pErr.message);
    if (!products || products.length === 0) throw new Error("No valid products");

    const lineItems = data.items.map((i) => {
      const p = products.find((x: any) => x.id === i.product_id);
      if (!p) throw new Error(`Product ${i.product_id} not available`);
      return { ...p, quantity: i.quantity };
    });
    const total = lineItems.reduce((s, i: any) => s + Number(i.price) * i.quantity, 0);

    // Get user email
    const { data: userRow } = await sb.auth.admin.getUserById(userId);
    const email = userRow.user?.email ?? undefined;
    const name = (userRow.user?.user_metadata?.display_name as string) ?? email?.split("@")[0];

    // Create order (pending)
    const { data: order, error: oErr } = await sb
      .from("orders")
      .insert({ user_id: userId, total, status: "pending" })
      .select("id")
      .single();
    if (oErr || !order) throw new Error(oErr?.message ?? "Order failed");

    const midtransOrderId = `KIN-${order.id.slice(0, 8)}-${Date.now()}`;
    const { error: itemsErr } = await sb.from("order_items").insert(
      lineItems.map((i: any) => ({
        order_id: order.id,
        product_id: i.id,
        price: i.price,
        quantity: i.quantity,
      })),
    );
    if (itemsErr) throw new Error(itemsErr.message);

    // Create Snap transaction
    const snap = await createSnapTransaction({
      orderId: midtransOrderId,
      grossAmount: Math.round(total),
      customer: { first_name: name, email },
      items: lineItems.map((i: any) => ({
        id: i.id, price: Number(i.price), quantity: i.quantity, name: i.name,
      })),
    });

    await sb.from("orders").update({
      midtrans_order_id: midtransOrderId,
      snap_token: snap.token,
      payment_url: snap.redirect_url,
    }).eq("id", order.id);

    return {
      orderId: order.id,
      midtransOrderId,
      snapToken: snap.token,
      redirectUrl: snap.redirect_url,
    };
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("*, items:order_items(*, product:products(id,name,slug,thumbnail_url,file_url))")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    return order;
  });
