import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListUsers, adminSetUserRole, adminDeleteUser } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Trash2, Shield, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/admin/users")({ component: UsersAdmin });

function UsersAdmin() {
  const list = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetUserRole);
  const del = useServerFn(adminDeleteUser);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const toggleAdmin = async (user_id: string, isAdmin: boolean) => {
    try { await setRole({ data: { user_id, role: "admin", grant: !isAdmin } }); toast.success(isAdmin ? "Admin removed" : "Promoted to admin"); qc.invalidateQueries({ queryKey: ["admin-users"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const remove = async (user_id: string) => {
    if (!confirm("Delete this user account permanently?")) return;
    try { await del({ data: { user_id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-users"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight mb-8">Users</h1>
      <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-surface-2/50 text-muted-foreground text-xs uppercase font-mono">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Roles</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {data.map((u: any) => {
              const isAdmin = u.roles.includes("admin");
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-surface-2 overflow-hidden shrink-0">
                        {u.avatar_url && <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-medium">{u.display_name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.roles.map((r: string) => (
                        <span key={r} className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${r === "admin" ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted-foreground"}`}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleAdmin(u.id, isAdmin)} className="p-1.5 hover:bg-surface-2 rounded" title={isAdmin ? "Remove admin" : "Make admin"}>
                      {isAdmin ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
                    </button>
                    <button onClick={() => remove(u.id)} className="p-1.5 hover:bg-surface-2 rounded text-destructive ml-1"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
