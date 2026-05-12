import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading]);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, total, status, created_at, items:order_items(id, price, quantity, product:products(id,name,slug,thumbnail_url,file_url))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!user) return null;

  const purchases = orders.flatMap((o: any) => o.items.map((i: any) => ({ ...i, order_date: o.created_at, order_id: o.id })));

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Account</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{user.email}</h1>
        </div>
        <button onClick={() => signOut()} className="text-sm text-muted-foreground hover:text-foreground">Sign out</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Stat label="Orders" value={orders.length} />
        <Stat label="Downloads" value={purchases.length} />
        <Stat label="Spent" value={`$${orders.reduce((s, o: any) => s + Number(o.total), 0).toFixed(2)}`} />
      </div>

      <h2 className="font-display text-xl font-bold mb-6">Download Center</h2>
      {purchases.length === 0 ? (
        <div className="border border-border rounded-2xl bg-surface/30 p-10 text-center text-sm text-muted-foreground">
          No purchases yet. <Link to="/" className="text-primary hover:underline">Browse products</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((p: any) => (
            <div key={p.id} className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl">
              <div className="size-14 rounded-lg overflow-hidden bg-surface-2 shrink-0">
                {p.product?.thumbnail_url && <img src={p.product.thumbnail_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link to="/products/$slug" params={{ slug: p.product.slug }} className="font-display font-bold hover:text-primary truncate block">{p.product.name}</Link>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">Order #{p.order_id.slice(0, 8)} · {new Date(p.order_date).toLocaleDateString()}</p>
              </div>
              <button className="bg-foreground text-background px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 transition">
                <Download className="size-3.5" /> Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      <p className="font-display text-3xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}
