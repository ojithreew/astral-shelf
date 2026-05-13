import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    thumbnail_url: string | null;
    author_name: string | null;
    rating: number;
    reviews_count: number;
    software: string | null;
  };
}

interface WishlistCtx {
  items: WishlistItem[];
  ids: Set<string>;
  count: number;
  loading: boolean;
  toggle: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<WishlistCtx>({} as WishlistCtx);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("wishlist")
      .select("id, product_id, product:products(id,name,slug,price,thumbnail_url,author_name,rating,reviews_count,software)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const ids = new Set(items.map(i => i.product_id));

  const toggle = async (productId: string) => {
    if (!user) { toast.error("Please sign in to use wishlist"); return; }
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      await supabase.from("wishlist").delete().eq("id", existing.id);
      toast.success("Removed from wishlist");
    } else {
      const { error } = await supabase.from("wishlist").insert({ user_id: user.id, product_id: productId });
      if (error) { toast.error(error.message); return; }
      toast.success("Saved to wishlist");
    }
    await refresh();
  };

  return (
    <Ctx.Provider value={{ items, ids, count: items.length, loading, toggle, has: (id) => ids.has(id), refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWishlist = () => useContext(Ctx);
