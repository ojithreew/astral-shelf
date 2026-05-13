import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Settings } from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: AdminLayout,
});

const NAV: Array<{ to: string; label: string; icon: any; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  const [allowed, setAllowed] = useState<null | boolean>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { if (!cancelled) setAllowed(false); return; }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) setAllowed(!!data);
    })();
    return () => { cancelled = true; };
  }, []);

  if (allowed === null) {
    return <div className="p-12 text-sm text-muted-foreground">Checking permissions…</div>;
  }
  if (!allowed) {
    return (
      <div className="max-w-md mx-auto p-12 text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Admin only</h1>
        <p className="text-muted-foreground text-sm mb-6">You don't have access to this area.</p>
        <Link to="/" className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold inline-block">
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3 px-3">Admin</div>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: !!n.exact }}
              activeProps={{ className: "bg-surface text-foreground" }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface/60 transition whitespace-nowrap"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
