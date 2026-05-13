import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin.functions";
import { Package, ShoppingCart, Users, Banknote } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const fn = useServerFn(getAdminStats);
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });

  const cards = [
    { label: "Revenue (paid)", value: data ? `Rp ${Number(data.revenue).toLocaleString("id-ID")}` : "—", icon: Banknote },
    { label: "Orders", value: data?.orders ?? "—", icon: ShoppingCart },
    { label: "Products", value: data?.products ?? "—", icon: Package },
    { label: "Users", value: data?.users ?? "—", icon: Users },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight mb-8">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-mono uppercase tracking-wider">{c.label}</span>
              <c.icon className="size-4" />
            </div>
            <div className="font-display text-2xl font-extrabold tracking-tight">
              {isLoading ? "…" : c.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
