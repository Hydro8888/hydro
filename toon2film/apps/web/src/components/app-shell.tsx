"use client";

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
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-provider";
import type { TranslationKey } from "@/lib/i18n";

const navItems = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/projects/new", labelKey: "nav.newProject", icon: FolderKanban },
  { href: "/source/upload", labelKey: "nav.source", icon: Upload },
  { href: "/projects/muyang-trailer", labelKey: "nav.preProduction", icon: Sparkles },
  { href: "/prompt-studio", labelKey: "nav.promptStudio", icon: WandSparkles },
  { href: "/video-studio", labelKey: "nav.videoStudio", icon: Clapperboard },
  { href: "/audio-studio", labelKey: "nav.audioStudio", icon: AudioLines },
  { href: "/export", labelKey: "nav.export", icon: Film },
  { href: "/settings", labelKey: "nav.settings", icon: Settings }
] satisfies Array<{
  href: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
}>;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-5 py-5">
            <div className="text-lg font-bold">Toon2Film</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("product.subtitle")}
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
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4">
            <Button className="w-full" variant="secondary">
              <FolderKanban className="h-4 w-4" aria-hidden="true" />
              {t("nav.projects")}
            </Button>
          </div>
        </div>
      </aside>
      <main className="lg:pl-64">
        <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0 lg:hidden">
              <div className="text-base font-bold">Toon2Film</div>
              <div className="text-xs font-medium uppercase text-muted-foreground">
                {t("product.subtitle")}
              </div>
            </div>
            <div className="ml-auto">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        <div className="mx-auto min-h-[calc(100vh-65px)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
