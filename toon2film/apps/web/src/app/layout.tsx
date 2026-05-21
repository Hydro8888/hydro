import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CriticalStudioStyle } from "@/components/critical-studio-style";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toon2Film",
  description: "AI film production workflow for toon and webtoon source material"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <CriticalStudioStyle />
      </head>
      <body>
        <LanguageProvider>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
