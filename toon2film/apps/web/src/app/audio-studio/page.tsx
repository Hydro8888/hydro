export default function AudioStudioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">Audio Studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dialogue, narration, BGM, SFX, and subtitles
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["Dialogue", "Narration", "BGM", "SFX"].map((track) => (
          <div
            key={track}
            className="rounded-lg border border-border bg-surface p-5 shadow-soft"
          >
            <h2 className="font-semibold">{track}</h2>
            <p className="mt-2 text-sm text-muted-foreground">0 clips assigned</p>
          </div>
        ))}
      </section>
    </div>
  );
}
