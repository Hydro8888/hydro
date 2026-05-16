import { CircleStop, Play, RefreshCcw } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { queueJobs } from "@/lib/mock-data";

export default function VideoStudioPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Video Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generation jobs, takes, and clip review
          </p>
        </div>
        <Button>
          <Play className="h-4 w-4" aria-hidden="true" />
          Generate Batch
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-surface shadow-soft">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Jobs</h2>
          <p className="text-sm text-muted-foreground">Provider task status</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Job</th>
                <th className="px-5 py-3 font-semibold">Provider</th>
                <th className="px-5 py-3 font-semibold">Shot</th>
                <th className="px-5 py-3 font-semibold">Cost</th>
                <th className="px-5 py-3 font-semibold">ETA</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {queueJobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-5 py-4 font-semibold">{job.id}</td>
                  <td className="px-5 py-4">{job.provider}</td>
                  <td className="px-5 py-4">{job.shot}</td>
                  <td className="px-5 py-4">{job.cost}</td>
                  <td className="px-5 py-4">{job.eta}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button className="h-8 px-3" variant="secondary">
                        <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button className="h-8 px-3" variant="ghost">
                        <CircleStop className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((take) => (
          <div
            key={take}
            className="overflow-hidden rounded-lg border border-border bg-surface shadow-soft"
          >
            <div className="aspect-video bg-[linear-gradient(135deg,#12335f,#0d9488_55%,#f59e0b)]" />
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold">Take {take}</h3>
                <p className="text-sm text-muted-foreground">S#01 / Shot 02</p>
              </div>
              <Button variant="secondary">Select</Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
