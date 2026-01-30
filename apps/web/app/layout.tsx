// apps/web/app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "sonner";
import { Share_Tech_Mono } from "next/font/google";

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
          <Link
            href="/vendors/ingest"
            className="rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-accent hover:text-accent-foreground"
          >
            Vendor ingest
          </Link>
          <Link
            href="/vendors/ingest/sessions"
            className="rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-accent hover:text-accent-foreground"
          >
            Sessions
          </Link>
          <Link
            href="/vendors/ingest/sessions?intent=pack"
            className="rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-accent hover:text-accent-foreground"
          >
            Pack verification
          </Link>
          <Link
            href="/curbside"
            className="rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-accent hover:text-accent-foreground"
          >
            Curbside
          </Link>
          <Link
            href="/ui-kit"
            className="rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-accent hover:text-accent-foreground"
          >
            UI kit
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
  return (
    <html lang="en" className="dark">
      <body className={machineMono.variable}>
        <div className="dm-app-bg min-h-screen">
          <TopNav />
          {children}
        </div>
        <Toaster position="bottom-right" theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
