import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { verifyMidtransSignature } from "@/lib/midtrans.server";

export const Route = createFileRoute("/api/public/midtrans/notification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const {
          order_id,
          status_code,
          gross_amount,
          signature_key,
          transaction_status,
          fraud_status,
          payment_type,
        } = body ?? {};

        if (!order_id || !status_code || !gross_amount || !signature_key) {
          return new Response("Missing fields", { status: 400 });
        }

        if (!verifyMidtransSignature(order_id, status_code, gross_amount, signature_key)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let newStatus: "paid" | "pending" | "failed" | "cancelled" = "pending";
        if (transaction_status === "capture") {
          newStatus = fraud_status === "challenge" ? "pending" : "paid";
        } else if (transaction_status === "settlement") {
          newStatus = "paid";
        } else if (
          transaction_status === "deny" ||
          transaction_status === "expire" ||
          transaction_status === "failure"
        ) {
          newStatus = "failed";
        } else if (transaction_status === "cancel") {
          newStatus = "cancelled";
        } else if (transaction_status === "pending") {
          newStatus = "pending";
        }

        const sb = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const patch: any = {
          status: newStatus,
          payment_method: payment_type ?? null,
          updated_at: new Date().toISOString(),
        };
        if (newStatus === "paid") patch.paid_at = new Date().toISOString();

        const { error } = await sb
          .from("orders")
          .update(patch)
          .eq("midtrans_order_id", order_id);

        if (error) {
          console.error("Midtrans webhook update error:", error);
          return new Response("DB error", { status: 500 });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
