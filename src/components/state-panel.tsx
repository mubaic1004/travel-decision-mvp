interface StatePanelProps {
  eyebrow: string;
  title: string;
  description: string;
  tone?: "default" | "error";
}

export function StatePanel({
  eyebrow,
  title,
  description,
  tone = "default",
}: StatePanelProps) {
  const toneClassName =
    tone === "error"
      ? "border-rose-400/30 bg-rose-500/10"
      : "border-white/10 bg-white/[0.03]";

  return (
    <article className={`rounded-2xl border p-6 backdrop-blur-sm ${toneClassName}`}>
      <p className={`section-eyebrow ${tone === "error" ? "text-rose-300" : ""}`}>{eyebrow}</p>
      <div className="mt-4 h-px w-full bg-white/10" />
      <h3 className="mt-3 text-2xl font-normal leading-snug text-white">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{description}</p>
    </article>
  );
}

export function LoadingCards() {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          className="animate-pulse space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          key={`loading-card-${index}`}
        >
          <div className="h-7 w-28 rounded-full bg-white/10" />
          <div className="h-px w-full bg-white/10" />
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-8 w-36 rounded-full bg-white/10" />
              <div className="h-4 w-44 rounded-full bg-white/10" />
            </div>
            <div className="h-10 w-24 rounded-full bg-white/10" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((__, metricIndex) => (
              <div className="rounded-lg bg-white/[0.05] p-4" key={metricIndex}>
                <div className="h-3 w-20 rounded-full bg-white/10" />
                <div className="mt-3 h-4 w-24 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
          <div className="h-24 rounded-lg bg-white/[0.05]" />
          <div className="h-24 rounded-lg bg-white/[0.05]" />
        </article>
      ))}
    </div>
  );
}
