import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    thumbnail_url: string | null;
    author_name: string | null;
  };
}

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  add: (productId: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => Promise<void>;
}

const Ctx = createContext<CartCtx>({} as CartCtx);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, product:products(id,name,slug,price,thumbnail_url,author_name)")
      .eq("user_id", user.id);
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const add = async (productId: string) => {
    if (!user) {
      toast.error("Please sign in to add to cart");
      return;
    }
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      toast.info("Already in your cart");
      return;
    }
    const { error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity: 1 });
    if (error) { toast.error(error.message); return; }
    toast.success("Added to cart");
    await refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    await refresh();
  };

  const clear = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    await refresh();
  };

  const total = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, count: items.length, total, loading, add, remove, refresh, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);
