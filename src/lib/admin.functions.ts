import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./admin-middleware";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function adminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---- Check current user is admin (called from client) ----
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

// ---- Dashboard stats ----
export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const sb = adminClient();
    const [products, orders, users, paid] = await Promise.all([
      sb.from("products").select("id", { count: "exact", head: true }),
      sb.from("orders").select("id", { count: "exact", head: true }),
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("orders").select("total").eq("status", "paid"),
    ]);
    const revenue = (paid.data ?? []).reduce((s, o: any) => s + Number(o.total), 0);
    return {
      products: products.count ?? 0,
      orders: orders.count ?? 0,
      users: users.count ?? 0,
      revenue,
    };
  });

// ---- Products ----
export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const sb = adminClient();
    const { data, error } = await sb
      .from("products")
      .select("*, category:categories(id,name,slug)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  tagline: z.string().max(300).nullable().optional(),
  description: z.string().max(10000).nullable().optional(),
  price: z.number().min(0),
  thumbnail_url: z.string().url().nullable().optional(),
  preview_url: z.string().url().nullable().optional(),
  file_url: z.string().url().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  software: z.string().max(80).nullable().optional(),
  author_name: z.string().max(120).nullable().optional(),
  is_featured: z.boolean().optional(),
  is_trending: z.boolean().optional(),
  is_published: z.boolean().optional(),
});

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = adminClient();
    const payload: any = { ...data, tags: data.tags ?? [] };
    if (data.id) {
      const { error } = await sb.from("products").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await sb.from("products").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = adminClient();
    const { error } = await sb.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Categories ----
export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const sb = adminClient();
    const { data, error } = await sb.from("categories").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertCategory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(80),
      slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
      icon: z.string().max(40).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = adminClient();
    if (data.id) {
      const { error } = await sb.from("categories").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb.from("categories").insert(data);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = adminClient();
    const { error } = await sb.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Orders ----
export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const sb = adminClient();
    const { data, error } = await sb
      .from("orders")
      .select("*, items:order_items(id,quantity,price,product:products(id,name,slug))")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    // Attach buyer email
    const userIds = Array.from(new Set((data ?? []).map((o: any) => o.user_id)));
    const profiles = userIds.length
      ? await sb.from("profiles").select("id, display_name").in("id", userIds)
      : { data: [] as any[] };
    const map = new Map((profiles.data ?? []).map((p: any) => [p.id, p]));
    return (data ?? []).map((o: any) => ({ ...o, buyer: map.get(o.user_id) ?? null }));
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "paid", "failed", "cancelled", "refunded"]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = adminClient();
    const patch: any = { status: data.status, updated_at: new Date().toISOString() };
    if (data.status === "paid") patch.paid_at = new Date().toISOString();
    const { error } = await sb.from("orders").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Users ----
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const sb = adminClient();
    const [{ data: profiles }, { data: roles }, { data: authUsers }] = await Promise.all([
      sb.from("profiles").select("*").order("created_at", { ascending: false }),
      sb.from("user_roles").select("user_id, role"),
      sb.auth.admin.listUsers({ perPage: 200 }),
    ]);
    const rolesMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = rolesMap.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesMap.set(r.user_id, arr);
    });
    const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email]));
    return (profiles ?? []).map((p: any) => ({
      ...p,
      email: emailMap.get(p.id) ?? null,
      roles: rolesMap.get(p.id) ?? [],
    }));
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      role: z.enum(["admin", "user"]),
      grant: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = adminClient();
    if (data.grant) {
      const { error } = await sb
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = adminClient();
    const { error } = await sb.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Settings ----
export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = adminClient();
  const { data } = await sb.from("settings").select("key, value");
  const obj: Record<string, any> = {};
  (data ?? []).forEach((r: any) => (obj[r.key] = r.value));
  return obj;
});

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ entries: z.record(z.string().min(1).max(80), z.any()) }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = adminClient();
    const rows = Object.entries(data.entries).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await sb.from("settings").upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
