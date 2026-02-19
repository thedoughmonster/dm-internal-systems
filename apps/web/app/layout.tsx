// apps/web/app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Settings } from "lucide-react";
import "./globals.css";
import { Toaster } from "sonner";
import {
  Audiowide,
  Chakra_Petch,
  Michroma,
  Orbitron,
  Oxanium,
  Quantico,
  Space_Grotesk,
  Tektur,
  SUSE_Mono,
  Share_Tech_Mono,
} from "next/font/google";
import GlobalSidebarShell from "@/app/composites/global-sidebar-shell";
import { topNavItems } from "@/lib/navigation-registry";

const machineMono = SUSE_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-machine-mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const quantico = Quantico({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-quantico",
});

const chakraPetch = Chakra_Petch({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-chakra-petch",
});

const michroma = Michroma({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-michroma",
});

const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-audiowide",
});

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-share-tech-mono",
});

const tektur = Tektur({
  subsets: ["latin"],
  variable: "--font-tektur",
});

export const metadata: Metadata = {
  title: "DM Internal Tools",
  description: "Dough Monster internal systems and operational tooling",
};

function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
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
          {topNavItems.map((item) => (
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
      <body
        className={[
          machineMono.variable,
          spaceGrotesk.variable,
          oxanium.variable,
          orbitron.variable,
          quantico.variable,
          chakraPetch.variable,
          michroma.variable,
          audiowide.variable,
          shareTechMono.variable,
          tektur.variable,
          "h-svh overflow-hidden",
        ].join(" ")}
      >
        <div className="dm-app-bg h-full overflow-hidden pt-14">
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
