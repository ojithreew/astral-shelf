import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  gallery: any;
  preview_url: string | null;
  category_id: string | null;
  tags: string[];
  software: string | null;
  author_name: string | null;
  rating: number;
  reviews_count: number;
  downloads_count: number;
  is_featured: boolean;
  is_trending: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await supabase.from("categories").select("id,name,slug").order("name");
  return (data as Category[]) ?? [];
}

export interface ProductsFilter {
  q?: string;
  category?: string;
  sort?: "newest" | "popular" | "price_asc" | "price_desc";
}

export async function fetchProducts(filter: ProductsFilter = {}): Promise<Product[]> {
  let q = supabase.from("products").select("*").eq("is_published", true);
  if (filter.q) q = q.ilike("name", `%${filter.q}%`);
  if (filter.category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", filter.category).maybeSingle();
    if (cat) q = q.eq("category_id", cat.id);
  }
  switch (filter.sort) {
    case "popular": q = q.order("downloads_count", { ascending: false }); break;
    case "price_asc": q = q.order("price", { ascending: true }); break;
    case "price_desc": q = q.order("price", { ascending: false }); break;
    default: q = q.order("created_at", { ascending: false });
  }
  const { data } = await q;
  return (data as Product[]) ?? [];
}

export async function fetchFeatured(): Promise<Product[]> {
  const { data } = await supabase.from("products").select("*").eq("is_featured", true).eq("is_published", true).limit(2);
  return (data as Product[]) ?? [];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  return data as Product | null;
}
