"use client";

import type { ReactNode } from "react";

import type { AppCopy } from "@/lib/i18n";

interface WizardShellProps {
  current: number;
  total: number;
  eyebrow: string;
  title: string;
  description: string;
  error?: string;
  children: ReactNode;
  navCopy: AppCopy["wizard"]["nav"];
  progressLabel: string;
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  isLoading?: boolean;
}

export function WizardShell({
  current,
  total,
  eyebrow,
  title,
  description,
  error,
  children,
  navCopy,
  progressLabel,
  onBack,
  onNext,
  onSkip,
  nextLabel,
  isLoading = false,
}: WizardShellProps) {
  const progressRatio = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col px-4 pb-10 pt-6 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-[#c4ab7a]">
          <span>{eyebrow}</span>
          <span>{progressLabel}</span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-200/70">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#c78a3e,#93a895)] transition-[width] duration-500 ease-out"
            style={{ width: `${progressRatio}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        <h2 className="font-rounded-display text-[2rem] font-normal leading-[1.18] text-stone-950 sm:text-[2.6rem]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-stone-600 sm:text-base">
          {description}
        </p>

        <div className="mt-8">{children}</div>

        {error ? (
          <div className="mt-6 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          className="rounded-full px-4 py-2.5 text-sm text-stone-500 transition hover:text-stone-800 disabled:invisible"
          disabled={!onBack}
          onClick={onBack}
          type="button"
        >
          ← {navCopy.back}
        </button>

        <div className="flex items-center gap-2">
          {onSkip ? (
            <button
              className="rounded-full px-4 py-2.5 text-sm text-stone-500 transition hover:text-stone-800"
              onClick={onSkip}
              type="button"
            >
              {navCopy.skip}
            </button>
          ) : null}
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#93a895] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#7f957f] disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={isLoading}
            onClick={onNext}
            type="button"
          >
            {isLoading ? navCopy.loading : nextLabel ?? navCopy.next}
          </button>
        </div>
      </div>
    </div>
  );
}
