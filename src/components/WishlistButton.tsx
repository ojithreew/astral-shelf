import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

export function WishlistButton({ productId, className = "", size = "md" }: { productId: string; className?: string; size?: "sm" | "md" | "lg" }) {
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const nav = useNavigate();
  const active = has(productId);
  const dim = size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-9";
  const ic = size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4";

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) { nav({ to: "/login" }); return; }
        toggle(productId);
      }}
      className={`${dim} inline-flex items-center justify-center rounded-full backdrop-blur-md border transition ${
        active
          ? "bg-rose-500/20 border-rose-400/40 text-rose-400"
          : "bg-background/60 border-white/10 text-foreground hover:bg-background/80 hover:border-white/20"
      } ${className}`}
    >
      <Heart className={`${ic} ${active ? "fill-rose-400" : ""}`} />
    </button>
  );
}
