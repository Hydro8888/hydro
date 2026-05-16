import { Check, ShieldCheck, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";

const modes = ["Quick", "Expert", "Director"];

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">New Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Production settings for a toon-to-film workflow
        </p>
      </div>

      <form className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-border bg-surface p-5 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Project name">
              <TextInput placeholder="Muyang" />
            </Field>
            <Field label="Original title">
              <TextInput placeholder="Line 9 Shaman" />
            </Field>
            <Field label="Production type">
              <SelectInput defaultValue="Trailer">
                <option>Trailer</option>
                <option>Short</option>
                <option>Feature sequence</option>
                <option>Short-form</option>
              </SelectInput>
            </Field>
            <Field label="Target length">
              <SelectInput defaultValue="60 sec">
                <option>30 sec</option>
                <option>60 sec</option>
                <option>3 min</option>
                <option>5 min</option>
                <option>10 min</option>
              </SelectInput>
            </Field>
            <Field label="Style">
              <SelectInput defaultValue="Korean thriller">
                <option>Korean thriller</option>
                <option>Live-action cinema</option>
                <option>Noir</option>
                <option>Horror</option>
                <option>Fantasy</option>
                <option>Sci-fi</option>
              </SelectInput>
            </Field>
            <Field label="Language">
              <SelectInput defaultValue="Korean">
                <option>Korean</option>
                <option>English</option>
                <option>Japanese</option>
              </SelectInput>
            </Field>
            <Field label="Aspect ratio">
              <SelectInput defaultValue="16:9">
                <option>16:9</option>
                <option>9:16</option>
                <option>1:1</option>
              </SelectInput>
            </Field>
            <Field label="Rating guardrail">
              <SelectInput defaultValue="15+">
                <option>All ages</option>
                <option>12+</option>
                <option>15+</option>
                <option>No adult content</option>
              </SelectInput>
            </Field>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Mode</h2>
            <div className="mt-4 grid gap-2">
              {modes.map((mode, index) => (
                <label
                  key={mode}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 transition hover:bg-muted"
                >
                  <input
                    name="mode"
                    type="radio"
                    defaultChecked={index === 1}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="font-medium">{mode}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
              Rights
            </h2>
            <div className="mt-4 grid gap-3 text-sm">
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>I own or control the uploaded source rights.</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>No unauthorized real-person likeness is included.</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>Commercial use is cleared by the rights holder.</span>
              </label>
            </div>
          </section>

          <Button className="w-full">
            <Check className="h-4 w-4" aria-hidden="true" />
            Create Project
          </Button>
          <Button className="w-full" variant="secondary">
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            Draft From Source
          </Button>
        </aside>
      </form>
    </div>
  );
}
