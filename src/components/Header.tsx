import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User as UserIcon, Heart, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const { count: wCount } = useWishlist();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user?.id]);

  return (
    <header className="sticky top-0 z-50 border-b border-border glass">
      <div className="max-w-[1500px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Link to="/" className="font-display text-xl font-extrabold tracking-tighter uppercase">
            Kinetic
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="text-foreground" activeProps={{ className: "text-foreground" }}>Assets</Link>
            <a href="#" className="text-muted-foreground hover:text-foreground transition">Templates</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition">Plugins</a>
          </nav>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); nav({ to: "/", search: { q } as any }); }}
          className="flex-1 max-w-xl relative hidden sm:block"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the collection..."
            className="w-full bg-surface border border-border rounded-full py-2 pl-10 pr-16 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
          />
          <span className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded uppercase">⌘K</span>
        </form>

        <div className="flex items-center gap-3">
          <Link to="/wishlist" className="relative p-2 hover:bg-surface rounded-lg transition" aria-label="Wishlist">
            <Heart className="size-5" />
            {wCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full size-4 flex items-center justify-center">{wCount}</span>
            )}
          </Link>
          <Link to="/cart" className="relative p-2 hover:bg-surface rounded-lg transition" aria-label="Cart">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full size-4 flex items-center justify-center">{count}</span>
            )}
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin" className="p-2 hover:bg-surface rounded-lg transition text-primary" aria-label="Admin">
                  <Shield className="size-5" />
                </Link>
              )}
              <Link to="/dashboard" className="p-2 hover:bg-surface rounded-lg transition" aria-label="Account">
                <UserIcon className="size-5" />
              </Link>
              <button onClick={() => signOut()} className="text-sm text-muted-foreground hover:text-foreground hidden md:inline">Sign out</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:inline">Sign in</Link>
              <Link to="/signup" className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
