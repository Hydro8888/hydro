import { Camera, FileText, ListChecks, UserRound } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projects, shots } from "@/lib/mock-data";

const productionDocs = [
  {
    title: "Story Bible",
    icon: FileText,
    status: "review" as const,
    value: "Logline, synopsis, 3-act structure"
  },
  {
    title: "Character Bible",
    icon: UserRound,
    status: "processing" as const,
    value: "4 characters, 2 reference images"
  },
  {
    title: "Scene Breakdown",
    icon: ListChecks,
    status: "done" as const,
    value: "5 scenes, 18 total shots"
  },
  {
    title: "Shot List",
    icon: Camera,
    status: "processing" as const,
    value: "12 prompts ready"
  }
];

export default async function ProjectPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projects.find((item) => item.id === id) ?? projects[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-normal">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.originalTitle} / {project.type} / {project.duration}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Regenerate</Button>
          <Button>Generate Video</Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {productionDocs.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.title}
              className="rounded-lg border border-border bg-surface p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <StatusBadge status={doc.status} />
              </div>
              <h2 className="mt-4 font-semibold">{doc.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{doc.value}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-lg border border-border bg-surface shadow-soft">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Shot List</h2>
          <p className="text-sm text-muted-foreground">
            Camera and prompt planning
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Scene</th>
                <th className="px-5 py-3 font-semibold">Shot</th>
                <th className="px-5 py-3 font-semibold">Framing</th>
                <th className="px-5 py-3 font-semibold">Camera</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Length</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shots.map((shot) => (
                <tr key={shot.id}>
                  <td className="px-5 py-4 font-medium">{shot.scene}</td>
                  <td className="px-5 py-4">{shot.shot}</td>
                  <td className="px-5 py-4">{shot.framing}</td>
                  <td className="px-5 py-4">{shot.camera}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {shot.summary}
                  </td>
                  <td className="px-5 py-4">{shot.duration}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={shot.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
