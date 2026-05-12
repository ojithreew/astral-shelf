import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">Create account</h1>
      <p className="text-sm text-muted-foreground mb-8">Join to buy and manage premium digital assets.</p>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
        <input type="password" required minLength={6} placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
        <button disabled={busy} className="w-full bg-foreground text-background font-bold rounded-lg py-2.5 text-sm disabled:opacity-50">{busy ? "…" : "Create account"}</button>
      </form>
      <p className="text-sm text-muted-foreground mt-6 text-center">Have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
    </div>
  );
}
