import { Copy, Languages, RefreshCcw, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const promptSections = [
  ["Subject", "A pale Korean man in his early 30s, tired eyes, black coat"],
  ["Action", "Sits silently between commuters while watching a shaman broadcast"],
  ["Location", "Interior of Seoul subway line 9 during daytime"],
  ["Camera", "Medium shot, slow left-to-right slider movement, 32mm lens"],
  ["Lighting", "Cold fluorescent subway light, muted reflections"],
  ["Style", "Realistic Korean psychological thriller, subtle film grain"],
  ["Negative", "Avoid cartoon style, distorted face, extra fingers, unreadable text"]
];

export default function PromptStudioPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Prompt Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seedance-ready shot prompts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Languages className="h-4 w-4" aria-hidden="true" />
            Translate
          </Button>
          <Button>
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            Generate
          </Button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-border bg-surface shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">S#01 / Shot 02</h2>
              <p className="text-sm text-muted-foreground">6 sec / 16:9</p>
            </div>
            <Button variant="ghost">
              <Copy className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {promptSections.map(([label, value]) => (
              <div key={label} className="grid gap-2 px-5 py-4 md:grid-cols-[120px_1fr]">
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-sm leading-6 text-muted-foreground">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Presets</h2>
            <div className="mt-4 grid gap-2">
              {["Korean thriller", "Muted daylight", "Slow slider", "32mm lens"].map(
                (preset) => (
                  <button
                    key={preset}
                    className="h-10 rounded-md border border-border px-3 text-left text-sm font-medium transition hover:bg-muted"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Provider Format</h2>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Provider</span>
                <span className="font-medium text-foreground">Seedance</span>
              </div>
              <div className="flex justify-between">
                <span>Model</span>
                <span className="font-medium text-foreground">env configured</span>
              </div>
              <div className="flex justify-between">
                <span>Input</span>
                <span className="font-medium text-foreground">Text/Image</span>
              </div>
            </div>
          </section>

          <Button className="w-full" variant="secondary">
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Regenerate Shot Prompt
          </Button>
        </aside>
      </section>
    </div>
  );
}
