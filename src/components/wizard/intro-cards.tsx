"use client";

import { useEffect, useState } from "react";

import type { AppCopy } from "@/lib/i18n";

interface IntroCardsProps {
  copy: AppCopy["wizard"]["intro"];
  onStart: () => void;
}

export function IntroCards({ copy, onStart }: IntroCardsProps) {
  const [index, setIndex] = useState(0);
  const total = copy.cards.length;
  const isLast = index === total - 1;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(total - 1, current + 1));
      } else if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
      } else if (event.key === "Enter" && index === total - 1) {
        onStart();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index, total, onStart]);

  const card = copy.cards[index];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col px-4 pb-10 pt-12 sm:px-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          className="w-full rounded-[36px] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(252,248,243,0.99)_0%,rgba(248,242,234,0.97)_42%,rgba(239,244,240,0.95)_100%)] p-8 shadow-[0_24px_64px_rgba(72,55,30,0.06)] sm:p-12"
          key={index}
        >
          <p className="text-[11px] uppercase tracking-[0.34em] text-[#ccb07a]">
            {card.eyebrow}
          </p>
          <h1 className="font-rounded-display hero-title-lively mt-5 text-[2.2rem] font-normal leading-[1.15] sm:text-[2.8rem]">
            {card.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-stone-600 sm:text-lg">
            {card.description}
          </p>
        </div>

        <div className="mt-8 flex items-center gap-2.5">
          {copy.cards.map((_, dotIndex) => (
            <button
              aria-label={`Go to card ${dotIndex + 1}`}
              className={`h-2 rounded-full transition-all ${
                dotIndex === index
                  ? "w-8 bg-[#c78a3e]"
                  : "w-2 bg-stone-300 hover:bg-stone-400"
              }`}
              key={dotIndex}
              onClick={() => setIndex(dotIndex)}
              type="button"
            />
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          className="rounded-full px-4 py-2.5 text-sm text-stone-500 transition hover:text-stone-800 disabled:invisible"
          disabled={index === 0}
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
          type="button"
        >
          ←
        </button>

        {isLast ? (
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#93a895] px-7 py-3 text-base font-medium text-white transition hover:bg-[#7f957f]"
            onClick={onStart}
            type="button"
          >
            {copy.startButton}
          </button>
        ) : (
          <button
            className="rounded-full px-4 py-2.5 text-sm text-stone-500 transition hover:text-stone-800"
            onClick={() => setIndex((current) => Math.min(total - 1, current + 1))}
            type="button"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}
