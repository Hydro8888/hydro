import { FileArchive, FileImage, FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

const fileTypes = [
  { label: "PDF", icon: FileText },
  { label: "JPG / PNG", icon: FileImage },
  { label: "ZIP", icon: FileArchive }
];

export default function SourceUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">Source Upload</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toon pages, webtoon strips, and source packages
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <UploadCloud className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Drop files</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            PDF, JPG, PNG, ZIP, or long webtoon image
          </p>
          <Button className="mt-6">Choose Files</Button>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Accepted Source</h2>
            <div className="mt-4 grid gap-3">
              {fileTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.label}
                    className="flex items-center gap-3 rounded-md border border-border p-3"
                  >
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Rights Check</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>I have the source rights.</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>No unauthorized likeness is included.</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>Commercial usage is cleared.</span>
              </label>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
