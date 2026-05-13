import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { createCheckoutSession, getMidtransConfig } from "@/lib/midtrans.functions";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/cart")({ component: CartPage });

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: {
        onSuccess?: (r: any) => void;
        onPending?: (r: any) => void;
        onError?: (r: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

function CartPage() {
  const { items, total, remove, clear, count, refresh } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const checkout = useServerFn(createCheckoutSession);
  const cfgFn = useServerFn(getMidtransConfig);
  const snapReady = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cfg = await cfgFn();
      if (cancelled || !cfg.clientKey) return;
      if (document.getElementById("midtrans-snap")) { snapReady.current = true; return; }
      const s = document.createElement("script");
      s.id = "midtrans-snap";
      s.src = cfg.isProduction
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";
      s.setAttribute("data-client-key", cfg.clientKey);
      s.onload = () => { snapReady.current = true; };
      document.body.appendChild(s);
    })();
    return () => { cancelled = true; };
  }, []);

  const pay = async () => {
    if (!user) { nav({ to: "/login" }); return; }
    if (items.length === 0) return;
    setBusy(true);
    try {
      const session = await checkout({
        data: { items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) },
      });
      if (!window.snap) {
        // fallback: full redirect
        window.location.href = session.redirectUrl;
        return;
      }
      window.snap.pay(session.snapToken, {
        onSuccess: async () => {
          toast.success("Payment successful");
          await clear();
          nav({ to: "/dashboard" });
        },
        onPending: async () => {
          toast.info("Waiting for payment confirmation");
          await refresh();
          nav({ to: "/dashboard" });
        },
        onError: () => {
          toast.error("Payment failed");
          setBusy(false);
        },
        onClose: () => {
          toast.message("Payment popup closed");
          setBusy(false);
        },
      });
    } catch (e: any) {
      toast.error(e.message ?? "Checkout failed");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight mb-8">Your Cart <span className="text-muted-foreground font-mono text-base">({count})</span></h1>

      {items.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-2xl bg-surface/30">
          <p className="text-muted-foreground mb-6">Your cart is empty.</p>
          <Link to="/" className="inline-block bg-foreground text-background px-5 py-2.5 rounded-lg text-sm font-bold">Browse products</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-3">
            {items.map((i) => (
              <div key={i.id} className="flex gap-4 p-4 bg-surface border border-border rounded-xl">
                <div className="size-20 rounded-lg overflow-hidden bg-surface-2 shrink-0">
                  {i.product.thumbnail_url && <img src={i.product.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to="/products/$slug" params={{ slug: i.product.slug }} className="font-display font-bold hover:text-primary truncate block">{i.product.name}</Link>
                  <p className="text-xs text-muted-foreground mt-1">{i.product.author_name}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <span className="font-display font-bold">Rp {Number(i.product.price).toLocaleString("id-ID")}</span>
                  <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="size-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <aside>
            <div className="sticky top-24 bg-surface border border-border rounded-2xl p-6 space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span className="text-foreground">Rp {total.toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>Tax</span><span className="text-foreground">Rp 0</span></div>
              <div className="border-t border-border pt-4 flex justify-between"><span className="font-display font-bold">Total</span><span className="font-display font-extrabold text-2xl tracking-tight">Rp {total.toLocaleString("id-ID")}</span></div>
              <button
                onClick={pay}
                disabled={busy}
                className="w-full bg-foreground text-background font-bold rounded-xl py-3 text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {busy ? "Processing…" : user ? "Pay with Midtrans" : "Sign in to checkout"}
              </button>
              <p className="text-[10px] font-mono text-muted-foreground uppercase text-center">Secure payment · Midtrans</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
