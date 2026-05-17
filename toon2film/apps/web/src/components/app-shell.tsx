"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Boxes,
  Clapperboard,
  Film,
  Home,
  KeyRound,
  Library,
  ListVideo,
  MessageSquare,
  PlusSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  WandSparkles
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/language-provider";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", labelKey: "nav.studioHome", icon: Home },
  { href: "/projects/new", labelKey: "nav.newProject", icon: PlusSquare },
  { href: "/prompt-studio", labelKey: "nav.storyPrompt", icon: WandSparkles },
  { href: "/projects/muyang-trailer", labelKey: "nav.characterBible", icon: BookOpen },
  { href: "/projects/muyang-trailer", labelKey: "nav.shotBuilder", icon: Clapperboard },
  { href: "/video-studio", labelKey: "nav.aiVideo", icon: ListVideo },
  { href: "/video-studio", labelKey: "nav.reviewRoom", icon: MessageSquare },
  { href: "/source/upload", labelKey: "nav.assetLibrary", icon: Library },
  { href: "/export", labelKey: "nav.export", icon: Film },
  { href: "/settings", labelKey: "nav.settings", icon: Settings }
] satisfies Array<{
  href: string;
  labelKey: TranslationKey;
  icon: typeof Home;
}>;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
  }

  return (
    <div className="studio-shell">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] border-r border-border/80 bg-[linear-gradient(180deg,hsl(224_44%_7%),hsl(225_43%_9%)_48%,hsl(229_49%_6%))] lg:block">
        <div className="film-perforation pointer-events-none absolute inset-y-0 right-0 w-9 opacity-35" />
        <div className="relative flex h-full flex-col">
          <Link href="/" className="block border-b border-border/80 px-8 py-6">
            <div className="text-2xl font-black tracking-tight text-foreground">
              Toon<span className="text-primary">2</span>Film
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/85">
              {t("product.subtitle")}
            </div>
          </Link>

          <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={`${item.href}-${item.labelKey}`}
                  href={item.href}
                  className={cn(
                    "group relative flex min-h-12 items-center gap-3 rounded-lg border px-3 text-sm font-semibold transition",
                    active
                      ? "border-primary/35 bg-primary/10 text-primary shadow-[inset_3px_0_0_hsl(var(--primary))]"
                      : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/55 hover:text-foreground"
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/40">
                    <Icon
                      className={cn(
                        "h-4 w-4 transition",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      )}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="leading-snug">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-4 border-t border-border/80 p-5">
            <div className="studio-panel p-4">
              <div className="text-xs font-semibold text-foreground">{t("shell.planName")}</div>
              <div className="mt-3 text-xs text-muted-foreground">{t("shell.credits")}</div>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-2xl font-black">12,450</span>
                <span className="pb-1 text-xs text-muted-foreground">/ 20,000</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[62%] rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--warning)))]" />
              </div>
              <div className="mt-2 text-right text-xs text-muted-foreground">62%</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="poster-frame poster-blonde flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black">
                HY
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{t("shell.adminName")}</div>
                <div className="truncate text-xs text-muted-foreground">{t("shell.adminEmail")}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 lg:pl-[250px]">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/78 backdrop-blur-xl">
          <div className="flex min-h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-7">
            <Link href="/" className="min-w-0 lg:hidden">
              <div className="text-lg font-black tracking-tight">
                Toon<span className="text-primary">2</span>Film
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("product.subtitle")}
              </div>
            </Link>

            <form
              className="hidden min-w-[220px] max-w-sm flex-1 items-center gap-2 rounded-lg border border-border/80 bg-surface/55 px-3 py-2 shadow-soft md:flex"
              onSubmit={handleSearch}
            >
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label={t("shell.searchPlaceholder")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("shell.searchPlaceholder")}
                type="search"
              />
              <span className="rounded border border-border/70 bg-background/50 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {t("shell.commandKey")}
              </span>
            </form>

            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <LanguageSwitcher />
              <div className="hidden h-9 items-center gap-2 rounded-full border border-border/80 bg-surface/70 px-3 text-xs font-bold md:flex">
                <span>{t("shell.apiStatus")}</span>
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-success">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  {t("shell.apiOk")}
                </span>
              </div>
              <button
                type="button"
                aria-label="Notifications"
                className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-surface/70 text-muted-foreground transition hover:text-foreground sm:flex"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-black text-primary-foreground">
                  3
                </span>
              </button>
              <button
                type="button"
                aria-label="Profile"
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-surface/70 text-muted-foreground transition hover:text-foreground sm:flex"
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-border/60 px-4 py-2 sm:grid-cols-3 lg:hidden">
            {navItems.slice(0, 6).map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={`mobile-${item.href}-${item.labelKey}`}
                  href={item.href}
                  className={cn(
                    "inline-flex h-10 min-w-0 items-center gap-2 rounded-md border px-3 text-xs font-semibold",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 bg-surface/50 text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </header>

        <div className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-7">
          {children}
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-6 right-6 hidden gap-2 text-xs text-muted-foreground xl:flex">
        <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
        <span>{t("studio.alertNginx")}</span>
        <KeyRound className="ml-2 h-4 w-4 text-primary" aria-hidden="true" />
        <span>{t("studio.quickApiKeys")}</span>
        <Boxes className="ml-2 h-4 w-4 text-accent" aria-hidden="true" />
        <span>{t("studio.quickModel")}</span>
      </div>
    </div>
  );
}
