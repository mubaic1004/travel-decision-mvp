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
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-white/40">
          <span>{eyebrow}</span>
          <span>{progressLabel}</span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-500 ease-out"
            style={{ width: `${progressRatio}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-[2rem] font-normal leading-[1.18] tracking-[-0.02em] text-white sm:text-[2.6rem]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/55 sm:text-base">
          {description}
        </p>

        <div className="mt-8">{children}</div>

        {error ? (
          <div className="mt-6 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          className="rounded-full px-4 py-2.5 text-sm text-white/45 transition hover:text-white disabled:invisible"
          disabled={!onBack}
          onClick={onBack}
          type="button"
        >
          ← {navCopy.back}
        </button>

        <div className="flex items-center gap-2">
          {onSkip ? (
            <button
              className="rounded-full px-4 py-2.5 text-sm text-white/45 transition hover:text-white"
              onClick={onSkip}
              type="button"
            >
              {navCopy.skip}
            </button>
          ) : null}
          <button
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-normal text-black transition hover:bg-[#e2e2e6] disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-black/50"
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
