// apps/web/app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Code, Settings } from "lucide-react";
import "./globals.css";
import { Toaster } from "sonner";
import { Share_Tech_Mono } from "next/font/google";
import GlobalSidebarShell from "@/app/composites/global-sidebar-shell";
import { topNavItems } from "@/lib/navigation-registry";

const machineMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-machine-mono",
});

export const metadata: Metadata = {
  title: "DM Internal Tools",
  description: "Dough Monster internal systems and operational tooling",
};

function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="dm-machine-mono text-sm tracking-wide text-foreground hover:text-foreground/90"
          >
            $ DM Internal Tools
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            ops console
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {topNavItems.filter((item) => item.id !== "directives").map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-accent hover:text-accent-foreground"
            >
              {item.title}
            </Link>
          ))}
          <Link
            href="/settings"
            className="rounded-md p-2 text-foreground/80 hover:bg-accent hover:text-accent-foreground"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <Link
            href="/directives"
            className="rounded-md p-2 text-foreground/80 hover:bg-accent hover:text-accent-foreground"
            aria-label="Directives"
          >
            <Code className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const SIDEBAR_TOGGLEABLE = true;

  return (
    <html lang="en" className="dark">
      <body className={machineMono.variable}>
        <div className="dm-app-bg min-h-screen">
          <TopNav />
          <GlobalSidebarShell toggleable={SIDEBAR_TOGGLEABLE}>
            {children}
          </GlobalSidebarShell>
        </div>
        <Toaster position="bottom-right" theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
