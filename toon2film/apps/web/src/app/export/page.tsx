import { Download, FileJson, FileText, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

const exportTypes = [
  { label: "MP4 movie", icon: Film },
  { label: "Prompt package", icon: FileJson },
  { label: "Scenario PDF", icon: FileText },
  { label: "Storyboard PDF", icon: FileText }
];

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">Export</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Final render files and production documents
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {exportTypes.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-lg border border-border bg-surface p-5 shadow-soft"
            >
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 font-semibold">{item.label}</h2>
              <Button className="mt-4 w-full" variant="secondary">
                <Download className="h-4 w-4" aria-hidden="true" />
                Prepare
              </Button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
