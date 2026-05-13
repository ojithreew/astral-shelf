import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListOrders, adminUpdateOrderStatus } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: OrdersAdmin });

const STATUSES = ["pending", "paid", "failed", "cancelled", "refunded"] as const;
const COLORS: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-400",
  pending: "bg-amber-500/10 text-amber-400",
  failed: "bg-rose-500/10 text-rose-400",
  cancelled: "bg-zinc-500/10 text-zinc-400",
  refunded: "bg-blue-500/10 text-blue-400",
};

function OrdersAdmin() {
  const list = useServerFn(adminListOrders);
  const update = useServerFn(adminUpdateOrderStatus);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => list() });

  const setStatus = async (id: string, status: any) => {
    try { await update({ data: { id, status } }); toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight mb-8">Orders & Transactions</h1>
      <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-surface-2/50 text-muted-foreground text-xs uppercase font-mono">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Buyer</th>
              <th className="text-left px-4 py-3">Items</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Method</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && data.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No orders yet</td></tr>}
            {data.map((o: any) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">
                  <div className="text-foreground">{o.midtrans_order_id ?? o.id.slice(0, 8)}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{o.buyer?.display_name ?? o.user_id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {(o.items ?? []).map((i: any) => i.product?.name).filter(Boolean).slice(0, 2).join(", ") || "—"}
                  {o.items?.length > 2 && ` +${o.items.length - 2}`}
                </td>
                <td className="px-4 py-3 text-right font-mono">Rp {Number(o.total).toLocaleString("id-ID")}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs uppercase">{o.payment_method ?? "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => setStatus(o.id, e.target.value)}
                    className={`text-[10px] font-mono uppercase px-2 py-1 rounded border-0 ${COLORS[o.status] ?? "bg-surface-2"}`}
                  >
                    {STATUSES.map((s) => <option key={s} value={s} className="bg-background text-foreground">{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
