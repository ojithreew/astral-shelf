import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchFeatured, fetchProducts, type ProductsFilter } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { useMemo, useState } from "react";
import { Star } from "lucide-react";

interface Search {
  q?: string;
  category?: string;
  sort?: ProductsFilter["sort"];
}

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: (s.q as string) || undefined,
    category: (s.category as string) || undefined,
    sort: (s.sort as Search["sort"]) || undefined,
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const [sort, setSort] = useState<ProductsFilter["sort"]>(search.sort ?? "newest");

  const filter: ProductsFilter = useMemo(
    () => ({ q: search.q, category: search.category, sort }),
    [search.q, search.category, sort]
  );

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", filter],
    queryFn: () => fetchProducts(filter),
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: featured = [] } = useQuery({ queryKey: ["featured"], queryFn: fetchFeatured });

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-8 flex gap-12">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 hidden lg:block">
        <div className="space-y-10 sticky top-24">
          <section>
            <h3 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Categories</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  search={{}}
                  className={`flex items-center justify-between text-sm w-full ${!search.category ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <span>All Products</span>
                  <span className="font-mono text-[10px]">{products.length}</span>
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/"
                    search={{ category: c.slug }}
                    className={`flex items-center justify-between text-sm w-full ${search.category === c.slug ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <span>{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-5 bg-primary/5 rounded-2xl border border-primary/20">
            <p className="text-xs text-primary/90 leading-relaxed font-medium mb-3 italic">
              "The highest density of premium assets for the modern engineer."
            </p>
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Curated weekly</span>
          </section>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {/* Featured */}
        {!search.q && !search.category && featured.length > 0 && (
          <section className="mb-12 animate-reveal">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-2xl font-bold tracking-tight">Trending Assets</h2>
              <span className="text-xs font-mono text-primary uppercase tracking-wider">Featured</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map((p) => (
                <Link
                  key={p.id}
                  to="/products/$slug"
                  params={{ slug: p.slug }}
                  className="group relative overflow-hidden rounded-3xl bg-surface border border-border p-1"
                >
                  <div className="w-full aspect-[16/9] rounded-[calc(1.5rem-4px)] overflow-hidden">
                    {p.thumbnail_url && (
                      <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="p-6 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-mono text-primary uppercase mb-2 block">Featured</span>
                      <h3 className="font-display text-xl font-bold">{p.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">By {p.author_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-display font-bold">{Number(p.price) === 0 ? "Free" : `$${p.price}`}</div>
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 justify-end">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {Number(p.rating).toFixed(1)} ({p.reviews_count})
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filters bar */}
        <section className="animate-reveal" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4 gap-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {(["newest", "popular", "price_asc", "price_desc"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                    sort === s
                      ? "bg-foreground text-background"
                      : "bg-surface border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "newest" ? "Newest" : s === "popular" ? "Popular" : s === "price_asc" ? "Price ↑" : "Price ↓"}
                </button>
              ))}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              {isLoading ? "Loading…" : `${products.length} results`}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-2xl bg-surface mb-4" />
                  <div className="h-3 w-2/3 bg-surface rounded mb-2" />
                  <div className="h-2 w-1/3 bg-surface rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm">No products found.</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
