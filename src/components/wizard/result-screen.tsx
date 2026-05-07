"use client";

import { ResultCard } from "@/components/result-card";
import { LoadingCards, StatePanel } from "@/components/state-panel";
import type { AppCopy, Locale } from "@/lib/i18n";
import type { SearchResult } from "@/types/travel";

type ViewState = "loading" | "success" | "empty" | "error";

interface ResultScreenProps {
  copy: AppCopy;
  locale: Locale;
  viewState: ViewState;
  results: SearchResult | null;
  onReplan: () => void;
}

export function ResultScreen({
  copy,
  locale,
  viewState,
  results,
  onReplan,
}: ResultScreenProps) {
  const cards = [
    { ...copy.options.cheapest, key: "cheapestOption" as const, sequence: "01" },
    { ...copy.options.leastLeave, key: "leastLeaveOption" as const, sequence: "02" },
    { ...copy.options.bestValue, key: "bestValueOption" as const, sequence: "03" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1300px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow eyebrow-gold">{copy.wizard.result.eyebrow}</p>
          <h2 className="font-rounded-display mt-3 text-[2rem] font-normal leading-[1.18] text-stone-950 sm:text-[2.6rem]">
            {copy.wizard.result.title}
          </h2>
          {viewState === "success" && results ? (
            <p className="mt-3 text-sm text-stone-600">
              {copy.board.evaluated(results.evaluatedOptions.length)}
            </p>
          ) : null}
        </div>

        <button
          className="self-start rounded-full border border-stone-300 bg-white/70 px-5 py-2.5 text-sm text-stone-700 transition hover:border-stone-400 hover:text-stone-900 sm:self-end"
          onClick={onReplan}
          type="button"
        >
          ↺ {copy.wizard.result.replanButton}
        </button>
      </div>

      {viewState === "loading" ? <LoadingCards /> : null}

      {viewState === "empty" ? (
        <StatePanel
          description={copy.states.emptyDescription}
          eyebrow={copy.states.waitingEyebrow}
          title={copy.states.emptyTitle}
        />
      ) : null}

      {viewState === "error" ? (
        <StatePanel
          description={copy.states.errorDescription}
          eyebrow={copy.states.errorEyebrow}
          title={copy.states.errorTitle}
          tone="error"
        />
      ) : null}

      {viewState === "success" && results ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {cards.map((card) => (
            <ResultCard
              copy={copy.card}
              key={card.key}
              locale={locale}
              option={results[card.key]}
              sequence={card.sequence}
              shortLabel={card.short}
              subtitle={card.subtitle}
              title={card.title}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
