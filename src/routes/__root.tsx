import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "@/lib/store";
import { Wordmark } from "@/components/grant-ui";

function NotFoundComponent() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl">Page not found</h1>
      <p className="mt-2 text-muted">This address does not match a page. Go back to your shortlist.</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-navy underline">Open the shortlist</Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-xl">This page did not load</h1>
      <p className="mt-2 text-muted">Your profile is saved. Try loading the page again.</p>
      <button
        onClick={() => { router.invalidate(); reset(); }}
        className="mt-6 rounded-lg bg-navy px-4 py-2 font-semibold text-ivory"
      >
        Load the page again
      </button>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Grantastic" },
      { name: "description", content: "Funding navigation for small nonprofits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const nav = "rounded px-2 py-2 font-medium text-muted hover:text-text [&.active]:text-navy [&.active]:underline underline-offset-4";
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link to="/" className="flex flex-col">
              <Wordmark />
              <span className="text-sm text-muted">Great missions deserve a clear path to funding.</span>
            </Link>
            <nav className="flex gap-2" aria-label="Main">
              <Link to="/" className={nav} activeOptions={{ exact: true }}>Shortlist</Link>
              <Link to="/add" className={nav}>Add a funder page</Link>
              <Link to="/about" className={nav}>How it works</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-[1120px] px-4 py-6">
          <Outlet />
        </main>
        <footer className="mx-auto max-w-[1120px] px-4 pb-8 text-sm text-muted">
          AI assists. People verify, decide, and submit.
        </footer>
      </StoreProvider>
    </QueryClientProvider>
  );
}
