import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProductBySlug, fetchProducts } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";
import { WishlistButton } from "@/components/WishlistButton";
import { Star, Download, Check } from "lucide-react";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const { add, items } = useCart();
  const nav = useNavigate();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related", product?.category_id],
    queryFn: () => fetchProducts({}),
    enabled: !!product,
    select: (all) => all.filter((p) => p.id !== product?.id && p.category_id === product?.category_id).slice(0, 3),
  });

  if (isLoading) {
    return <div className="max-w-[1200px] mx-auto px-6 py-20 text-muted-foreground">Loading…</div>;
  }
  if (!product) {
    return <div className="max-w-[1200px] mx-auto px-6 py-20">Product not found.</div>;
  }

  const inCart = items.some((i) => i.product_id === product.id);
  const free = Number(product.price) === 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6">
        <Link to="/" className="hover:text-foreground">Marketplace</Link> / {product.name}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3">
          <div className="rounded-2xl overflow-hidden bg-surface border border-border aspect-[16/10]">
            {product.thumbnail_url && (
              <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="mt-10 prose prose-invert max-w-none">
            <h2 className="font-display text-xl font-bold mb-4">About this asset</h2>
            <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
              {product.description ?? product.tagline}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            {product.software && (
              <span className="inline-block bg-surface border border-border px-2 py-1 rounded-md text-[10px] font-mono uppercase">
                {product.software}
              </span>
            )}
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground text-sm">{product.tagline}</p>

            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="text-foreground">{Number(product.rating).toFixed(1)}</span>
                <span>({product.reviews_count})</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="size-3.5" />
                <span>{product.downloads_count.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-baseline justify-between mb-6">
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Price</span>
                <span className={`font-display text-4xl font-extrabold tracking-tighter ${free ? "text-emerald-400" : ""}`}>
                  {free ? "Free" : `$${product.price}`}
                </span>
              </div>

              <button
                disabled={inCart}
                onClick={() => {
                  if (!user) { nav({ to: "/login" }); return; }
                  add(product.id);
                }}
                className="w-full bg-foreground text-background font-bold rounded-xl py-3 text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inCart ? (<><Check className="size-4" /> In your cart</>) : "Add to cart"}
              </button>

              <div className="mt-3 flex gap-2">
                <Link
                  to="/cart"
                  className="flex-1 block text-center bg-surface border border-border rounded-xl py-3 text-sm font-medium hover:bg-surface-2 transition"
                >
                  View cart
                </Link>
                <WishlistButton productId={product.id} size="lg" className="!rounded-xl !size-auto px-4 border-border" />
              </div>
            </div>

            <div className="border-t border-border pt-6 space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground"><span>Author</span><span className="text-foreground">{product.author_name}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>License</span><span className="text-foreground">Standard</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Format</span><span className="text-foreground">{product.software ?? "Digital"}</span></div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 pt-10 border-t border-border">
          <h2 className="font-display text-xl font-bold mb-8">Related assets</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {related.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
