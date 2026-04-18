"use client";

import { useEffect, useState } from "react";

import {
  APP_COPY,
  LOCALE_OPTIONS,
  isLocale,
  type Locale,
} from "@/lib/i18n";
import { ResultCard } from "@/components/result-card";
import { SearchForm } from "@/components/search-form";
import { LoadingCards, StatePanel } from "@/components/state-panel";
import { searchTripOptions } from "@/lib/travel/search";
import type { SearchInput, SearchResult } from "@/types/travel";

type ViewState = "idle" | "loading" | "success" | "empty" | "error";

const LOCALE_STORAGE_KEY = "travel-decision-locale";

export function TravelMvp() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [results, setResults] = useState<SearchResult | null>(null);

  const copy = APP_COPY[locale];
  const resultCards = [
    {
      ...copy.options.cheapest,
      key: "cheapestOption" as const,
      sequence: "01",
    },
    {
      ...copy.options.leastLeave,
      key: "leastLeaveOption" as const,
      sequence: "02",
    },
    {
      ...copy.options.bestValue,
      key: "bestValueOption" as const,
      sequence: "03",
    },
  ];

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && isLocale(savedLocale)) {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  async function handleSearch(input: SearchInput) {
    setViewState("loading");

    try {
      const nextResults = await searchTripOptions(input);
      setResults(nextResults);
      setViewState(nextResults.evaluatedOptions.length > 0 ? "success" : "empty");
    } catch (error) {
      console.error(error);
      setResults(null);
      setViewState("error");
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <section className="relative mb-6 overflow-hidden rounded-[42px] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(252,248,243,0.99)_0%,rgba(248,242,234,0.97)_42%,rgba(239,244,240,0.95)_100%)] p-6 text-stone-950 shadow-[0_24px_64px_rgba(72,55,30,0.06)] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(229,216,191,0.42),transparent_26%),radial-gradient(circle_at_18%_82%,rgba(151,171,156,0.18),transparent_24%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(186,160,117,0.5),transparent)]" />

          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.34em] text-[#ccb07a]">
                  {copy.hero.eyebrow}
                </p>
                <h1 className="font-rounded-display hero-title-lively mt-4 text-[2.2rem] font-normal leading-[1.15] sm:text-[2.8rem] lg:text-[3.3rem]">
                  {copy.hero.title}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                  {copy.hero.description}
                </p>
              </div>

              <div className="self-start">
                <div className="locale-switcher">
                  <span className="locale-switcher-label">{copy.language.label}</span>
                  <div className="locale-switcher-buttons">
                    {LOCALE_OPTIONS.map((option) => (
                      <button
                        className={`locale-button ${locale === option.value ? "locale-button-active" : ""}`}
                        key={option.value}
                        onClick={() => setLocale(option.value)}
                        type="button"
                      >
                        {option.value === "en"
                          ? copy.language.english
                          : copy.language.chinese}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section className="workspace-shell">
          <div className="grid gap-6 xl:grid-cols-[470px_minmax(0,1fr)]">
            <SearchForm
              copy={copy.form}
              isLoading={viewState === "loading"}
              onSearch={handleSearch}
            />

            <section className="space-y-5">
              <article className="section-spotlight">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="section-eyebrow eyebrow-gold">{copy.board.eyebrow}</p>
                    <h2 className="font-rounded-display mt-3 text-[1.85rem] font-normal leading-[1.2] text-stone-900">
                      {copy.board.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {copy.board.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="soft-pill">{copy.board.chips.price}</span>
                    <span className="soft-pill">{copy.board.chips.leaveDays}</span>
                    <span className="soft-pill">{copy.board.chips.effectiveHours}</span>
                  </div>
                </div>

                <div className="mt-5 luxury-rule" />

                <div className="mt-4 rounded-[26px] border border-stone-200/80 bg-white/[0.72] px-4 py-3 text-sm text-stone-600">
                  {results?.evaluatedOptions.length
                    ? copy.board.evaluated(results.evaluatedOptions.length)
                    : copy.board.empty}
                </div>
              </article>

              {viewState === "idle" ? (
                <StatePanel
                  description={copy.states.idleDescription}
                  eyebrow={copy.states.waitingEyebrow}
                  title={copy.states.idleTitle}
                />
              ) : null}

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
                <div className="grid gap-5 xl:grid-cols-3">
                  {resultCards.map((card) => (
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
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
