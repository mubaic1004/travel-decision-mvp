"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { IntroCards } from "@/components/wizard/intro-cards";
import { ResultScreen } from "@/components/wizard/result-screen";
import { StepDates } from "@/components/wizard/step-dates";
import { StepDestination } from "@/components/wizard/step-destination";
import { StepDuration } from "@/components/wizard/step-duration";
import { StepOrigin } from "@/components/wizard/step-origin";
import { StepPreferences } from "@/components/wizard/step-preferences";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { DEFAULT_SEARCH_FORM_VALUES } from "@/lib/constants";
import {
  APP_COPY,
  LOCALE_OPTIONS,
  isLocale,
  type Locale,
} from "@/lib/i18n";
import {
  STEP_ORDER,
  toSearchInput,
  validateAll,
  validateStep,
  type FormErrors,
  type StepKey,
} from "@/lib/wizard/step-validation";
import { searchTripOptions } from "@/lib/travel/search";
import type { SearchFormValues, SearchResult } from "@/types/travel";

type Phase = "intro" | StepKey | "result";

type ViewState = "loading" | "success" | "empty" | "error";

const LOCALE_STORAGE_KEY = "travel-decision-locale";

export function TravelMvp() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [phase, setPhase] = useState<Phase>("intro");
  const [values, setValues] = useState<SearchFormValues>(DEFAULT_SEARCH_FORM_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [results, setResults] = useState<SearchResult | null>(null);

  const copy = APP_COPY[locale];
  const wizardCopy = copy.wizard;

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

  function updateValue<Key extends keyof SearchFormValues>(
    key: Key,
    value: SearchFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function goToStep(index: number) {
    const next = STEP_ORDER[index];
    if (next) {
      setPhase(next);
      setErrors({});
    }
  }

  function handleStepNext(stepKey: StepKey) {
    const stepErrors = validateStep(stepKey, values, copy.form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    const currentIndex = STEP_ORDER.indexOf(stepKey);
    if (currentIndex < STEP_ORDER.length - 1) {
      setPhase(STEP_ORDER[currentIndex + 1]);
    } else {
      void runSearch();
    }
  }

  function handleStepBack(stepKey: StepKey) {
    const currentIndex = STEP_ORDER.indexOf(stepKey);
    setErrors({});
    if (currentIndex === 0) {
      setPhase("intro");
    } else {
      setPhase(STEP_ORDER[currentIndex - 1]);
    }
  }

  async function runSearch() {
    const fullErrors = validateAll(values, copy.form);
    if (Object.keys(fullErrors).length > 0) {
      // Jump back to first failing step
      const firstFailing = STEP_ORDER.find(
        (step) => Object.keys(validateStep(step, values, copy.form)).length > 0,
      );
      if (firstFailing) {
        setPhase(firstFailing);
        setErrors(fullErrors);
      }
      return;
    }

    setPhase("result");
    setViewState("loading");
    try {
      const next = await searchTripOptions(toSearchInput(values));
      setResults(next);
      setViewState(next.evaluatedOptions.length > 0 ? "success" : "empty");
    } catch (error) {
      console.error(error);
      setResults(null);
      setViewState("error");
    }
  }

  function handleReplan() {
    setPhase(STEP_ORDER[0]);
    setErrors({});
  }

  // Locale switcher kept on intro screen only, top-right corner.
  const localeSwitcher = (
    <div className="locale-switcher absolute right-4 top-4 sm:right-6 sm:top-6">
      <span className="locale-switcher-label">{copy.language.label}</span>
      <div className="locale-switcher-buttons">
        {LOCALE_OPTIONS.map((option) => (
          <button
            className={`locale-button ${locale === option.value ? "locale-button-active" : ""}`}
            key={option.value}
            onClick={() => setLocale(option.value)}
            type="button"
          >
            {option.value === "en" ? copy.language.english : copy.language.chinese}
          </button>
        ))}
      </div>
    </div>
  );

  const total = STEP_ORDER.length;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#010103]">
      <div className="aurora-bg pointer-events-none fixed inset-0" />
      <div className="dot-grid pointer-events-none fixed inset-0" />
      <div className="relative">
        {phase === "intro" ? (
          <>
            <Link
              className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/50 backdrop-blur transition hover:border-white/30 hover:text-white sm:left-6 sm:top-6"
              href="/"
            >
              ← chenmubai.cn
            </Link>
            {localeSwitcher}
            <IntroCards copy={wizardCopy.intro} onStart={() => goToStep(0)} />
          </>
        ) : null}

        {phase === "origin" ? (
          <WizardShell
            current={1}
            description={wizardCopy.steps.origin.description}
            error={errors.form}
            eyebrow={wizardCopy.steps.origin.eyebrow}
            navCopy={wizardCopy.nav}
            onBack={() => handleStepBack("origin")}
            onNext={() => handleStepNext("origin")}
            progressLabel={wizardCopy.progress(1, total)}
            title={wizardCopy.steps.origin.title}
            total={total}
          >
            <StepOrigin
              fieldError={errors.originCity}
              fieldLabel={copy.form.fields.originCity}
              formCopy={copy.form}
              onChange={(value) => updateValue("originCity", value)}
              placeholder={copy.form.placeholders.originCity}
              value={values.originCity}
            />
          </WizardShell>
        ) : null}

        {phase === "destination" ? (
          <WizardShell
            current={2}
            description={wizardCopy.steps.destination.description}
            error={errors.form}
            eyebrow={wizardCopy.steps.destination.eyebrow}
            navCopy={wizardCopy.nav}
            onBack={() => handleStepBack("destination")}
            onNext={() => handleStepNext("destination")}
            progressLabel={wizardCopy.progress(2, total)}
            title={wizardCopy.steps.destination.title}
            total={total}
          >
            <StepDestination
              fieldError={errors.destinations}
              fieldLabel={copy.form.fields.destinations}
              hint={copy.form.destinationsHint}
              onChange={(value) => updateValue("destinations", value)}
              placeholder={copy.form.placeholders.destinations}
              value={values.destinations}
            />
          </WizardShell>
        ) : null}

        {phase === "dates" ? (
          <WizardShell
            current={3}
            description={wizardCopy.steps.dates.description}
            error={errors.form}
            eyebrow={wizardCopy.steps.dates.eyebrow}
            navCopy={wizardCopy.nav}
            onBack={() => handleStepBack("dates")}
            onNext={() => handleStepNext("dates")}
            progressLabel={wizardCopy.progress(3, total)}
            title={wizardCopy.steps.dates.title}
            total={total}
          >
            <StepDates
              endError={errors.dateRangeEnd}
              endValue={values.dateRangeEnd}
              fields={copy.form.fields}
              onEndChange={(value) => updateValue("dateRangeEnd", value)}
              onStartChange={(value) => updateValue("dateRangeStart", value)}
              startValue={values.dateRangeStart}
            />
          </WizardShell>
        ) : null}

        {phase === "duration" ? (
          <WizardShell
            current={4}
            description={wizardCopy.steps.duration.description}
            error={errors.form}
            eyebrow={wizardCopy.steps.duration.eyebrow}
            navCopy={wizardCopy.nav}
            onBack={() => handleStepBack("duration")}
            onNext={() => handleStepNext("duration")}
            progressLabel={wizardCopy.progress(4, total)}
            title={wizardCopy.steps.duration.title}
            total={total}
          >
            <StepDuration
              errors={errors}
              fields={copy.form.fields}
              maxLeaveDays={values.maxLeaveDays}
              onChange={(key, value) => updateValue(key, value)}
              tripLengthMax={values.tripLengthMax}
              tripLengthMin={values.tripLengthMin}
            />
          </WizardShell>
        ) : null}

        {phase === "preferences" ? (
          <WizardShell
            current={5}
            description={wizardCopy.steps.preferences.description}
            error={errors.form}
            eyebrow={wizardCopy.steps.preferences.eyebrow}
            isLoading={false}
            navCopy={wizardCopy.nav}
            nextLabel={wizardCopy.nav.submit}
            onBack={() => handleStepBack("preferences")}
            onNext={() => handleStepNext("preferences")}
            onSkip={() => void runSearch()}
            progressLabel={wizardCopy.progress(5, total)}
            title={wizardCopy.steps.preferences.title}
            total={total}
          >
            <StepPreferences
              earliestReturnTime={values.earliestReturnTime}
              errors={errors}
              fields={copy.form.fields}
              latestArrivalTime={values.latestArrivalTime}
              maxLayoverHours={values.maxLayoverHours}
              noRedEye={values.noRedEye}
              noRedEyeLabel={copy.form.noRedEye}
              onChange={(key, value) => updateValue(key, value as never)}
            />
          </WizardShell>
        ) : null}

        {phase === "result" ? (
          <ResultScreen
            copy={copy}
            locale={locale}
            onReplan={handleReplan}
            results={results}
            viewState={viewState}
          />
        ) : null}
      </div>
    </main>
  );
}
