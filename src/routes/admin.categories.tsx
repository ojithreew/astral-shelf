import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminListCategories, adminUpsertCategory, adminDeleteCategory } from "@/lib/admin.functions";
import { Plus, Trash2, Pencil, X } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({ component: CategoriesAdmin });

function CategoriesAdmin() {
  const list = useServerFn(adminListCategories);
  const upsert = useServerFn(adminUpsertCategory);
  const remove = useServerFn(adminDeleteCategory);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-categories"], queryFn: () => list() });

  const onDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try { await remove({ data: { id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-categories"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Categories</h1>
        <button onClick={() => setEditing({})} className="bg-foreground text-background font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Plus className="size-4" /> New
        </button>
      </div>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/50 text-muted-foreground text-xs uppercase font-mono">
            <tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Slug</th><th className="text-left px-4 py-3">Icon</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && data.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No categories</td></tr>}
            {data.map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.icon ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(c)} className="p-1.5 hover:bg-surface-2 rounded"><Pencil className="size-4" /></button>
                  <button onClick={() => onDelete(c.id)} className="p-1.5 hover:bg-surface-2 rounded text-destructive ml-1"><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <CategoryForm initial={editing} onClose={() => setEditing(null)} onSave={async (p: any) => {
        try { await upsert({ data: p }); toast.success("Saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin-categories"] }); }
        catch (e: any) { toast.error(e.message); }
      }} />}
    </div>
  );
}

function CategoryForm({ initial, onClose, onSave }: any) {
  const [f, setF] = useState({ id: initial.id, name: initial.name ?? "", slug: initial.slug ?? "", icon: initial.icon ?? "" });
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); const p: any = { ...f, icon: f.icon || null }; if (!p.id) delete p.id; onSave(p); }} onClick={(e) => e.stopPropagation()} className="bg-surface border border-border rounded-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex justify-between"><h2 className="font-display text-lg font-bold">{f.id ? "Edit" : "New"} category</h2><button type="button" onClick={onClose}><X className="size-4" /></button></div>
        <div className="p-6 space-y-4">
          <input required placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          <input required placeholder="slug" pattern="[a-z0-9-]+" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono" />
          <input placeholder="Icon (optional)" value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3"><button type="button" onClick={onClose} className="text-sm text-muted-foreground">Cancel</button><button type="submit" className="bg-foreground text-background font-bold px-5 py-2 rounded-lg text-sm">Save</button></div>
      </form>
    </div>
  );
}
