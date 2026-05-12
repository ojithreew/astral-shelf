import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">Welcome back</h1>
      <p className="text-sm text-muted-foreground mb-8">Sign in to access your purchases and downloads.</p>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
        <button disabled={busy} className="w-full bg-foreground text-background font-bold rounded-lg py-2.5 text-sm disabled:opacity-50">{busy ? "…" : "Sign in"}</button>
      </form>
      <p className="text-sm text-muted-foreground mt-6 text-center">No account? <Link to="/signup" className="text-primary hover:underline">Create one</Link></p>
    </div>
  );
}
