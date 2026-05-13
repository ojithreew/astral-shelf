import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, Star, Trash2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Kinetic" },
      { name: "description", content: "Your saved digital assets and favorite products." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user, loading } = useAuth();
  const { items, loading: wLoading, toggle } = useWishlist();
  const { add } = useCart();
  const nav = useNavigate();

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [user, loading]);

  if (!user) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Saved</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3">
          Wishlist
          <span className="text-sm font-mono text-muted-foreground">{items.length}</span>
        </h1>
      </div>

      {wLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="border border-border rounded-2xl bg-surface/30 p-14 text-center">
          <Heart className="size-8 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">Your wishlist is empty.</p>
          <Link to="/" className="inline-block bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold">Browse marketplace</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const p = it.product;
            const free = Number(p.price) === 0;
            return (
              <div key={it.id} className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl group">
                <Link to="/products/$slug" params={{ slug: p.slug }} className="size-16 rounded-lg overflow-hidden bg-surface-2 shrink-0">
                  {p.thumbnail_url && <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to="/products/$slug" params={{ slug: p.slug }} className="font-display font-bold hover:text-primary truncate block">{p.name}</Link>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 font-mono">
                    <span>{p.author_name ?? "Anonymous"}</span>
                    <span className="flex items-center gap-1"><Star className="size-3 fill-amber-400 text-amber-400" />{Number(p.rating).toFixed(1)}</span>
                  </div>
                </div>
                <span className={`font-display text-lg font-extrabold tracking-tight ${free ? "text-emerald-400" : ""}`}>
                  {free ? "Free" : `$${Number(p.price).toFixed(0)}`}
                </span>
                <button
                  onClick={() => add(p.id)}
                  className="bg-foreground text-background px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 transition"
                >
                  <ShoppingBag className="size-3.5" /> Add
                </button>
                <button
                  onClick={() => toggle(p.id)}
                  className="p-2 text-muted-foreground hover:text-rose-400 transition"
                  aria-label="Remove"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
