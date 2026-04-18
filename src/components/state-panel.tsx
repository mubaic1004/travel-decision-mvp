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
      ? "border-rose-200 bg-[linear-gradient(180deg,rgba(255,245,245,0.96)_0%,rgba(255,238,238,0.92)_100%)]"
      : "border-stone-200 bg-[linear-gradient(180deg,rgba(255,252,248,0.96)_0%,rgba(250,244,235,0.9)_100%)]";

  return (
    <article className={`panel p-6 ${toneClassName}`}>
      <p className={`section-eyebrow ${tone === "error" ? "" : "eyebrow-gold"}`}>{eyebrow}</p>
      <div className="mt-4 luxury-rule" />
      <h3 className="font-rounded-display mt-3 text-2xl font-normal leading-snug text-stone-900">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">{description}</p>
    </article>
  );
}

export function LoadingCards() {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <article className="panel animate-pulse space-y-4 p-6" key={`loading-card-${index}`}>
          <div className="h-7 w-28 rounded-full bg-stone-200" />
          <div className="luxury-rule" />
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-8 w-36 rounded-full bg-stone-200" />
              <div className="h-4 w-44 rounded-full bg-stone-200" />
            </div>
            <div className="h-10 w-24 rounded-full bg-stone-200" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((__, metricIndex) => (
              <div className="rounded-[22px] bg-stone-100 p-4" key={metricIndex}>
                <div className="h-3 w-20 rounded-full bg-stone-200" />
                <div className="mt-3 h-4 w-24 rounded-full bg-stone-200" />
              </div>
            ))}
          </div>
          <div className="h-24 rounded-[22px] bg-stone-100" />
          <div className="h-24 rounded-[22px] bg-stone-100" />
        </article>
      ))}
    </div>
  );
}
