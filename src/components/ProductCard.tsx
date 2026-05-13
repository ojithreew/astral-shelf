import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Product } from "@/lib/products";
import { WishlistButton } from "@/components/WishlistButton";

export function ProductCard({ p, large = false }: { p: Product; large?: boolean }) {
  const free = Number(p.price) === 0;
  return (
    <Link
      to="/products/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col cursor-pointer"
    >
      <div className={`relative overflow-hidden rounded-2xl bg-surface mb-4 ring-1 ring-white/5 ${large ? "aspect-[16/10]" : "aspect-square"}`}>
        {p.thumbnail_url ? (
          <img
            src={p.thumbnail_url}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-2" />
        )}
        {p.software && (
          <span className="absolute top-3 left-3 bg-background/80 backdrop-blur px-2 py-1 rounded-md text-[10px] font-mono border border-white/10 uppercase">
            {p.software}
          </span>
        )}
        <WishlistButton productId={p.id} size="sm" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition" />
      </div>
      </div>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h4 className="font-display text-sm font-bold group-hover:text-primary transition-colors truncate">{p.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.author_name ?? "Anonymous"}</p>
        </div>
        <span className={`font-display text-sm font-bold tracking-tight whitespace-nowrap ${free ? "text-emerald-400" : ""}`}>
          {free ? "Free" : `$${Number(p.price).toFixed(0)}`}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase">
        <Star className="size-3 fill-amber-400 text-amber-400" />
        <span>{Number(p.rating).toFixed(1)}</span>
        <span>·</span>
        <span>{p.reviews_count.toLocaleString()} reviews</span>
      </div>
    </Link>
  );
}
