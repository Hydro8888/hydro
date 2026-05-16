import Link from "next/link";
import type { ReactNode } from "react";
import {
  AudioLines,
  Clapperboard,
  Film,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Sparkles,
  Upload,
  WandSparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects/new", label: "New Project", icon: FolderKanban },
  { href: "/source/upload", label: "Source", icon: Upload },
  { href: "/projects/muyang-trailer", label: "Pre-Production", icon: Sparkles },
  { href: "/prompt-studio", label: "Prompt Studio", icon: WandSparkles },
  { href: "/video-studio", label: "Video Studio", icon: Clapperboard },
  { href: "/audio-studio", label: "Audio Studio", icon: AudioLines },
  { href: "/export", label: "Export", icon: Film },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-5 py-5">
            <div className="text-lg font-bold">Toon2Film</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Production OS
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4">
            <Button className="w-full" variant="secondary">
              <FolderKanban className="h-4 w-4" aria-hidden="true" />
              Projects
            </Button>
          </div>
        </div>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
