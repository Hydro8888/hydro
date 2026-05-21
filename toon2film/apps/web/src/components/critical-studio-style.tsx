const criticalCss = `
:root {
  --t2f-bg: #050913;
  --t2f-panel: #111827;
  --t2f-panel-soft: #151d2d;
  --t2f-border: rgba(148, 163, 184, 0.24);
  --t2f-text: #f8fafc;
  --t2f-muted: #aab4c5;
  --t2f-primary: #f59e0b;
  --t2f-red: #ef4444;
  --t2f-blue: #60a5fa;
  --t2f-green: #22c55e;
}

* { box-sizing: border-box; }
html, body { min-height: 100%; }
body {
  margin: 0;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 14% 8%, rgba(245, 158, 11, 0.11), transparent 28%),
    radial-gradient(circle at 84% 18%, rgba(96, 165, 250, 0.13), transparent 30%),
    linear-gradient(135deg, #050913, #09111f 48%, #050913);
  color: var(--t2f-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
button, input, textarea, select { font: inherit; }
a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; }

.brand-logo-red {
  color: var(--t2f-red) !important;
  text-shadow: 0 0 18px rgba(239, 68, 68, 0.42);
}
.brand-logo-red span { color: var(--t2f-red) !important; }

.studio-shell {
  min-height: 100vh;
  color: var(--t2f-text);
}
.studio-shell > aside {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  width: 250px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--t2f-border);
  background: linear-gradient(180deg, #071021, #0b1020 48%, #050913);
}
.studio-shell > aside > div {
  position: relative;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}
.studio-shell > aside a:first-child {
  display: block;
  padding: 24px 32px;
  border-bottom: 1px solid var(--t2f-border);
}
.studio-shell nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
}
.studio-shell nav a {
  position: relative;
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--t2f-muted);
  font-size: 14px;
  font-weight: 700;
}
.studio-shell nav a:hover {
  border-color: var(--t2f-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--t2f-text);
}
.studio-shell nav a span:first-child {
  display: flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--t2f-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
}
.studio-shell > aside > div > div:last-child {
  padding: 20px;
  border-top: 1px solid var(--t2f-border);
}

.studio-shell > main {
  min-width: 0;
  min-height: 100vh;
  padding-left: 250px;
}
.studio-shell > main > header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--t2f-border);
  background: rgba(5, 9, 19, 0.86);
  backdrop-filter: blur(18px);
}
.studio-shell > main > header > div:first-child {
  display: flex;
  min-height: 72px;
  align-items: center;
  gap: 16px;
  padding: 0 28px;
}
.studio-shell > main > header form {
  display: flex;
  max-width: 390px;
  min-width: 260px;
  flex: 1;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid var(--t2f-border);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.74);
}
.studio-shell > main > header input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  color: var(--t2f-text);
  background: transparent;
}
.studio-shell > main > div {
  width: 100%;
  max-width: 1500px;
  min-height: calc(100vh - 72px);
  margin: 0 auto;
  padding: 20px 28px;
}

.studio-panel,
.studio-panel-hot {
  border: 1px solid var(--t2f-border);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.018)),
    linear-gradient(135deg, rgba(20, 29, 47, 0.98), rgba(8, 13, 27, 0.98));
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.28);
}
.studio-panel-hot {
  border-color: rgba(245, 158, 11, 0.36);
  box-shadow: 0 22px 70px rgba(245, 158, 11, 0.12);
}
.hero-reel {
  position: relative;
  min-height: 360px;
  overflow: hidden;
}
.hero-image-wrap {
  position: absolute;
  inset: 16px 16px 16px 0;
  left: auto;
  width: 74%;
  overflow: hidden;
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-radius: 14px;
}
.hero-image-wrap img,
.project-poster-image,
.cinematic-still-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.neon-button,
button,
[role="button"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
}
.neon-button {
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid rgba(245, 158, 11, 0.52);
  background: linear-gradient(135deg, #f97316, #f59e0b);
  color: #050913 !important;
  font-weight: 900;
  box-shadow: 0 14px 34px rgba(249, 115, 22, 0.28);
}

.grid { display: grid; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.block { display: block; }
.hidden { display: none; }
.relative { position: relative; }
.absolute { position: absolute; }
.sticky { position: sticky; }
.fixed { position: fixed; }
.overflow-hidden { overflow: hidden; }
.min-w-0 { min-width: 0; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.object-cover { object-fit: cover; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-5 { gap: 20px; }
.space-y-3 > * + * { margin-top: 12px; }
.space-y-4 > * + * { margin-top: 16px; }
.space-y-5 > * + * { margin-top: 20px; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.p-5 { padding: 20px; }
.px-3 { padding-left: 12px; padding-right: 12px; }
.py-1 { padding-top: 4px; padding-bottom: 4px; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mt-5 { margin-top: 20px; }
.mt-7 { margin-top: 28px; }
.rounded-md { border-radius: 8px; }
.rounded-lg { border-radius: 12px; }
.rounded-full { border-radius: 999px; }
.border { border: 1px solid var(--t2f-border); }
.text-xs { font-size: 12px; }
.text-sm { font-size: 14px; }
.text-base { font-size: 16px; }
.text-lg { font-size: 18px; }
.text-xl { font-size: 20px; }
.text-2xl { font-size: 24px; }
.text-3xl { font-size: 30px; }
.font-bold { font-weight: 700; }
.font-black { font-weight: 900; }
.font-semibold { font-weight: 700; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-muted-foreground { color: var(--t2f-muted); }
.text-primary { color: var(--t2f-primary); }
.text-foreground { color: var(--t2f-text); }

[class*="xl:grid-cols-[minmax"] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 348px;
  gap: 20px;
}
[class*="md:grid-cols-2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
[class*="2xl:grid-cols-4"] { grid-template-columns: repeat(4, minmax(0, 1fr)); }
[class*="xl:grid-cols-3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
[class*="2xl:grid-cols-6"] { grid-template-columns: repeat(6, minmax(0, 1fr)); }

.poster-frame {
  position: relative;
  min-height: 120px;
  overflow: hidden;
  border: 1px solid var(--t2f-border);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(96,165,250,0.25), rgba(245,158,11,0.2));
}
.poster-frame.has-image { height: 160px; }
.film-perforation {
  background-image:
    linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255,255,255,.18) 8px, transparent 8px, transparent 20px);
  background-size: 100% 100%, 18px 28px;
}
.manga-board {
  background:
    linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px) 0 0 / 34px 34px,
    linear-gradient(180deg, rgba(255,255,255,.14) 1px, transparent 1px) 0 0 / 34px 34px,
    radial-gradient(circle at 1px 1px, rgba(255,255,255,.16) 1px, transparent 0) 0 0 / 9px 9px;
}
.cinematic-stills-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}
.cinematic-still-card {
  position: relative;
  min-height: 210px;
  overflow: hidden;
  border: 1px solid var(--t2f-border);
  border-radius: 12px;
  background: var(--t2f-panel);
}
.cinematic-still-card-portrait { min-height: 280px; }
.cinematic-still-card img,
.poster-frame img {
  position: absolute;
  inset: 0;
}

@media (max-width: 1279px) {
  [class*="2xl:grid-cols-4"],
  [class*="2xl:grid-cols-6"],
  [class*="xl:grid-cols-3"] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  [class*="xl:grid-cols-[minmax"] {
    grid-template-columns: 1fr;
  }
  .cinematic-stills-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 1023px) {
  .studio-shell > aside { display: none; }
  .studio-shell > main { padding-left: 0; }
}
@media (max-width: 767px) {
  .studio-shell > main > div { padding: 16px; }
  .studio-shell > main > header > div:first-child { padding: 12px 16px; flex-wrap: wrap; }
  .hero-image-wrap { position: relative; inset: auto; width: 100%; height: 230px; margin-bottom: 16px; }
  .hero-reel { min-height: 0; }
  [class*="md:grid-cols-2"],
  [class*="2xl:grid-cols-4"],
  [class*="2xl:grid-cols-6"],
  [class*="xl:grid-cols-3"],
  .cinematic-stills-grid {
    grid-template-columns: 1fr;
  }
}
`;

export function CriticalStudioStyle() {
  return <style id="toon2film-critical-style" dangerouslySetInnerHTML={{ __html: criticalCss }} />;
}
