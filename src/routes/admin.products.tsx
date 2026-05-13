import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  adminListProducts, adminUpsertProduct, adminDeleteProduct, adminListCategories,
} from "@/lib/admin.functions";
import { Pencil, Trash2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/admin/products")({ component: ProductsAdmin });

function ProductsAdmin() {
  const list = useServerFn(adminListProducts);
  const cats = useServerFn(adminListCategories);
  const upsert = useServerFn(adminUpsertProduct);
  const remove = useServerFn(adminDeleteProduct);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);

  const { data: products = [], isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => list() });
  const { data: categories = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: () => cats() });

  const onDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await remove({ data: { id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Products</h1>
        <button onClick={() => setEditing({})} className="bg-foreground text-background font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Plus className="size-4" /> New product
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/50 text-muted-foreground text-xs uppercase font-mono">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Category</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-center px-4 py-3 hidden sm:table-cell">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && products.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No products yet</td></tr>}
            {products.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded bg-surface-2 overflow-hidden shrink-0">
                      {p.thumbnail_url && <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{p.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right font-mono">Rp {Number(p.price).toLocaleString("id-ID")}</td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${p.is_published ? "bg-emerald-500/10 text-emerald-400" : "bg-surface-2 text-muted-foreground"}`}>
                    {p.is_published ? "Live" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => setEditing(p)} className="p-1.5 hover:bg-surface-2 rounded"><Pencil className="size-4" /></button>
                    <button onClick={() => onDelete(p.id)} className="p-1.5 hover:bg-surface-2 rounded text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductEditor
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={async (payload: any) => {
            try {
              await upsert({ data: payload });
              toast.success(payload.id ? "Updated" : "Created");
              setEditing(null);
              qc.invalidateQueries({ queryKey: ["admin-products"] });
            } catch (e: any) { toast.error(e.message); }
          }}
        />
      )}
    </div>
  );
}

function ProductEditor({ initial, categories, onClose, onSave }: any) {
  const [f, setF] = useState({
    id: initial.id,
    name: initial.name ?? "",
    slug: initial.slug ?? "",
    tagline: initial.tagline ?? "",
    description: initial.description ?? "",
    price: initial.price ?? 0,
    thumbnail_url: initial.thumbnail_url ?? "",
    preview_url: initial.preview_url ?? "",
    file_url: initial.file_url ?? "",
    category_id: initial.category_id ?? "",
    tags: (initial.tags ?? []).join(", "),
    software: initial.software ?? "",
    author_name: initial.author_name ?? "",
    is_featured: initial.is_featured ?? false,
    is_trending: initial.is_trending ?? false,
    is_published: initial.is_published ?? true,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: any = {
      ...f,
      price: Number(f.price),
      tags: f.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      thumbnail_url: f.thumbnail_url || null,
      preview_url: f.preview_url || null,
      file_url: f.file_url || null,
      category_id: f.category_id || null,
      tagline: f.tagline || null,
      description: f.description || null,
      software: f.software || null,
      author_name: f.author_name || null,
    };
    if (!payload.id) delete payload.id;
    await onSave(payload);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display text-xl font-bold">{f.id ? "Edit product" : "New product"}</h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-surface-2 rounded"><X className="size-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Name *"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input} /></Field>
          <Field label="Slug * (lowercase, hyphens)"><input required pattern="[a-z0-9-]+" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className={input} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Price (IDR) *"><input required type="number" min="0" step="1" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} className={input} /></Field>
            <Field label="Category">
              <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })} className={input}>
                <option value="">—</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Tagline"><input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} className={input} /></Field>
          <Field label="Description"><textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={input} /></Field>
          <Field label="Thumbnail URL"><input value={f.thumbnail_url} onChange={(e) => setF({ ...f, thumbnail_url: e.target.value })} className={input} placeholder="https://..." /></Field>
          <Field label="Preview URL"><input value={f.preview_url} onChange={(e) => setF({ ...f, preview_url: e.target.value })} className={input} placeholder="https://..." /></Field>
          <Field label="File URL (download)"><input value={f.file_url} onChange={(e) => setF({ ...f, file_url: e.target.value })} className={input} placeholder="https://..." /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Software"><input value={f.software} onChange={(e) => setF({ ...f, software: e.target.value })} className={input} placeholder="Figma, React..." /></Field>
            <Field label="Author"><input value={f.author_name} onChange={(e) => setF({ ...f, author_name: e.target.value })} className={input} /></Field>
          </div>
          <Field label="Tags (comma-separated)"><input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} className={input} placeholder="ui, dashboard, dark" /></Field>
          <div className="flex flex-wrap gap-4 pt-2">
            <Toggle checked={f.is_published} onChange={(v: boolean) => setF({ ...f, is_published: v })} label="Published" />
            <Toggle checked={f.is_featured} onChange={(v: boolean) => setF({ ...f, is_featured: v })} label="Featured" />
            <Toggle checked={f.is_trending} onChange={(v: boolean) => setF({ ...f, is_trending: v })} label="Trending" />
          </div>
        </div>
        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button disabled={saving} type="submit" className="bg-foreground text-background font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}

const input = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50";

function Field({ label, children }: any) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }: any) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-primary" />
      {label}
    </label>
  );
}
