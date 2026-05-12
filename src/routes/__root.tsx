import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-extrabold text-foreground tracking-tighter">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="inline-flex mt-6 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold">
          Browse the marketplace
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-display font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kinetic — Premium Digital Marketplace" },
      { name: "description", content: "Marketplace for premium digital assets, UI kits, templates, and code." },
      { property: "og:title", content: "Kinetic — Premium Digital Marketplace" },
      { name: "twitter:title", content: "Kinetic — Premium Digital Marketplace" },
      { property: "og:description", content: "Marketplace for premium digital assets, UI kits, templates, and code." },
      { name: "twitter:description", content: "Marketplace for premium digital assets, UI kits, templates, and code." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/421f5898-6a18-4505-9e20-29f513fffd55/id-preview-f3c97bfa--b3a16082-7802-4fb5-b7fa-bdd055d33aba.lovable.app-1778587671768.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/421f5898-6a18-4505-9e20-29f513fffd55/id-preview-f3c97bfa--b3a16082-7802-4fb5-b7fa-bdd055d33aba.lovable.app-1778587671768.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Header />
          <Outlet />
          <Toaster theme="dark" position="bottom-right" />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
