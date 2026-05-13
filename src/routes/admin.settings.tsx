import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSettings, adminUpdateSettings } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdmin });

const FIELDS = [
  { key: "store_name", label: "Store name" },
  { key: "store_tagline", label: "Tagline" },
  { key: "currency", label: "Currency code" },
  { key: "currency_symbol", label: "Currency symbol" },
  { key: "support_email", label: "Support email" },
];

function SettingsAdmin() {
  const get = useServerFn(getSettings);
  const update = useServerFn(adminUpdateSettings);
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => get() });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      const init: Record<string, string> = {};
      FIELDS.forEach((f) => (init[f.key] = String(data[f.key] ?? "")));
      setForm(init);
    }
  }, [data]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await update({ data: { entries: form } });
      toast.success("Settings saved");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-extrabold tracking-tight mb-8">Settings</h1>
      <form onSubmit={submit} className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">{f.label}</span>
            <input
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />
          </label>
        ))}
        <div className="pt-4 border-t border-border">
          <button disabled={saving} className="bg-foreground text-background font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>

      <div className="mt-8 bg-surface border border-border rounded-2xl p-6 text-sm">
        <h2 className="font-display font-bold mb-3">Midtrans webhook</h2>
        <p className="text-muted-foreground text-xs mb-3">Paste this URL in Midtrans Dashboard → Settings → Configuration → Payment Notification URL:</p>
        <code className="block bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono break-all">
          {typeof window !== "undefined" ? `${window.location.origin}/api/public/midtrans/notification` : ""}
        </code>
      </div>
    </div>
  );
}
