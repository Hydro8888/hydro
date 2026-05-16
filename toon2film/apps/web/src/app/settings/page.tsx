import { KeyRound, Server, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provider keys, billing, and storage
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
            API Keys
          </h2>
          <div className="mt-4 grid gap-4">
            <Field label="Seedance key">
              <TextInput type="password" placeholder="Stored encrypted" />
            </Field>
            <Field label="LLM key">
              <TextInput type="password" placeholder="Stored encrypted" />
            </Field>
            <Button>Save Keys</Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <WalletCards className="h-5 w-5 text-accent" aria-hidden="true" />
            Billing
          </h2>
          <div className="mt-4 text-3xl font-bold">$184.20</div>
          <p className="mt-2 text-sm text-muted-foreground">Current month</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Server className="h-5 w-5 text-success" aria-hidden="true" />
            Storage
          </h2>
          <div className="mt-4 text-3xl font-bold">42 GB</div>
          <p className="mt-2 text-sm text-muted-foreground">Project media</p>
        </div>
      </section>
    </div>
  );
}
