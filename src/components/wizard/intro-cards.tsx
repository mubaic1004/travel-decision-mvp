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
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm sm:p-12"
          key={index}
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">
            {card.eyebrow}
          </p>
          <h1 className="mt-5 text-[2rem] font-normal leading-[1.15] tracking-[-0.02em] text-white sm:text-[2.6rem]">
            {card.title}
          </h1>
          <p className="mt-5 text-sm leading-7 text-white/55 sm:text-base">
            {card.description}
          </p>
        </div>

        <div className="mt-8 flex items-center gap-2.5">
          {copy.cards.map((_, dotIndex) => (
            <button
              aria-label={`Go to card ${dotIndex + 1}`}
              className={`h-2 rounded-full transition-all ${
                dotIndex === index
                  ? "w-8 bg-white"
                  : "w-2 bg-white/25 hover:bg-white/45"
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
          className="rounded-full px-4 py-2.5 text-sm text-white/45 transition hover:text-white disabled:invisible"
          disabled={index === 0}
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
          type="button"
        >
          ←
        </button>

        {isLast ? (
          <button
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-base font-normal text-black transition hover:bg-[#e2e2e6]"
            onClick={onStart}
            type="button"
          >
            {copy.startButton}
          </button>
        ) : (
          <button
            className="rounded-full px-4 py-2.5 text-sm text-white/45 transition hover:text-white"
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
