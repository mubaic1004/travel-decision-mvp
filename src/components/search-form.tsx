"use client";

import { type ChangeEvent, type FormEvent, type ReactNode, useState } from "react";

import type { AppCopy } from "@/lib/i18n";
import { diffDaysInclusive, toLocalDate } from "@/lib/travel/utils";
import type { SearchFormValues, SearchInput } from "@/types/travel";
import { DEFAULT_SEARCH_FORM_VALUES } from "@/lib/constants";

type FormErrors = Partial<Record<keyof SearchFormValues | "form", string>>;

interface SearchFormProps {
  isLoading: boolean;
  copy: AppCopy["form"];
  onSearch: (input: SearchInput) => Promise<void>;
}

function validateForm(
  values: SearchFormValues,
  copy: AppCopy["form"],
): FormErrors {
  const errors: FormErrors = {};
  const destinations = values.destinations
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const messages = copy.validation;

  if (!values.originCity.trim()) {
    errors.originCity = messages.originCityRequired;
  }

  if (!values.dateRangeStart || !values.dateRangeEnd) {
    errors.form = messages.dateWindowRequired;
    return errors;
  }

  if (values.dateRangeStart > values.dateRangeEnd) {
    errors.dateRangeEnd = messages.dateRangeEnd;
  }

  const maxLeaveDays = Number(values.maxLeaveDays);
  const tripLengthMin = Number(values.tripLengthMin);
  const tripLengthMax = Number(values.tripLengthMax);
  const maxLayoverHours = Number(values.maxLayoverHours);

  if (!Number.isFinite(maxLeaveDays) || maxLeaveDays < 0) {
    errors.maxLeaveDays = messages.maxLeaveDays;
  }

  if (!Number.isFinite(tripLengthMin) || tripLengthMin < 1) {
    errors.tripLengthMin = messages.tripLengthMin;
  }

  if (!Number.isFinite(tripLengthMax) || tripLengthMax < 1) {
    errors.tripLengthMax = messages.tripLengthMax;
  }

  if (tripLengthMin > tripLengthMax) {
    errors.tripLengthMax = messages.tripLengthRange;
  }

  if (!Number.isFinite(maxLayoverHours) || maxLayoverHours < 0) {
    errors.maxLayoverHours = messages.layoverHours;
  }

  if (!values.latestArrivalTime) {
    errors.latestArrivalTime = messages.latestArrivalTime;
  }

  if (!values.earliestReturnTime) {
    errors.earliestReturnTime = messages.earliestReturnTime;
  }

  if (destinations.length === 0) {
    errors.destinations = messages.destinations;
  }

  if (values.dateRangeStart && values.dateRangeEnd && Number.isFinite(tripLengthMin)) {
    const availableDays = diffDaysInclusive(
      toLocalDate(values.dateRangeStart),
      toLocalDate(values.dateRangeEnd),
    );

    if (availableDays < tripLengthMin) {
      errors.form = messages.dateWindowTooShort;
    }
  }

  return errors;
}

function toSearchInput(values: SearchFormValues): SearchInput {
  return {
    originCity: values.originCity.trim(),
    dateRangeStart: values.dateRangeStart,
    dateRangeEnd: values.dateRangeEnd,
    maxLeaveDays: Number(values.maxLeaveDays),
    tripLengthMin: Number(values.tripLengthMin),
    tripLengthMax: Number(values.tripLengthMax),
    destinations: values.destinations
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    filters: {
      noRedEye: values.noRedEye,
      maxLayoverHours: Number(values.maxLayoverHours),
      latestArrivalTime: values.latestArrivalTime,
      earliestReturnTime: values.earliestReturnTime,
    },
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-xs text-rose-600">{message}</p>;
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="form-section">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow eyebrow-gold">{eyebrow}</p>
          <h3 className="font-rounded-display mt-2 text-xl font-normal text-stone-900">{title}</h3>
        </div>
        <p className="max-w-md text-sm leading-6 text-stone-600">{description}</p>
      </div>
      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

function Snapshot({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="snapshot-tile">
      <p className="snapshot-label">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-stone-950">{value}</p>
    </div>
  );
}

function FilterChip({ label }: { label: string }) {
  return <span className="soft-pill">{label}</span>;
}

export function SearchForm({
  isLoading,
  copy,
  onSearch,
}: SearchFormProps) {
  const [values, setValues] = useState<SearchFormValues>(DEFAULT_SEARCH_FORM_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

  const destinationList = values.destinations
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const tripWindowDays =
    values.dateRangeStart && values.dateRangeEnd
      ? diffDaysInclusive(toLocalDate(values.dateRangeStart), toLocalDate(values.dateRangeEnd))
      : 0;

  function updateValue<Key extends keyof SearchFormValues>(
    key: Key,
    value: SearchFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleInputChange(
    key: keyof SearchFormValues,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const nextValue =
      event.currentTarget instanceof HTMLInputElement &&
      event.currentTarget.type === "checkbox"
        ? event.currentTarget.checked
        : event.currentTarget.value;

    updateValue(key, nextValue as SearchFormValues[typeof key]);
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(values, copy);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSearch(toSearchInput(values));
  }

  return (
    <section className="panel panel-form p-4 sm:p-6 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="hero-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow eyebrow-gold">{copy.heroEyebrow}</p>
            <h2 className="font-rounded-display mt-3 text-[1.55rem] font-normal leading-[1.22] text-stone-900 sm:text-[2rem]">
              {copy.heroTitle}
            </h2>
          </div>
          {copy.inventoryBadge ? (
            <span className="soft-pill shrink-0 whitespace-nowrap">{copy.inventoryBadge}</span>
          ) : null}
        </div>

        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">{copy.heroDescription}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Snapshot
            label={copy.snapshots.citiesLabel}
            value={destinationList[0] || "—"}
          />
          <Snapshot
            label={copy.snapshots.windowLabel}
            value={`${tripWindowDays || 0}`}
          />
          <Snapshot
            label={copy.snapshots.leaveLabel}
            value={`${values.maxLeaveDays || 0}`}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <FilterChip
            label={values.noRedEye ? copy.filterChips.redEyeOff : copy.filterChips.redEyeOn}
          />
          <FilterChip label={copy.filterChips.arriveBy(values.latestArrivalTime)} />
          <FilterChip label={copy.filterChips.returnAfter(values.earliestReturnTime)} />
          <FilterChip label={copy.filterChips.layover(values.maxLayoverHours)} />
        </div>

        <div className="mt-5">
          <button
            className="primary-button w-full"
            disabled={isLoading}
            form="travel-search-form"
            type="submit"
          >
            {isLoading ? copy.primaryActionLoading : copy.primaryActionButton}
          </button>
        </div>
      </div>

      <form className="mt-6 space-y-6" id="travel-search-form" onSubmit={handleSubmit}>
        <FormSection
          description={copy.sections.tripWindow.description}
          eyebrow={copy.sections.tripWindow.eyebrow}
          title={copy.sections.tripWindow.title}
        >
          <div className="space-y-5">
            <div>
              <label className="field-label" htmlFor="originCity">
                {copy.fields.originCity}
              </label>
              <input
                className="field-input"
                id="originCity"
                name="originCity"
                onChange={(event) => handleInputChange("originCity", event)}
                placeholder={copy.placeholders.originCity}
                type="text"
                value={values.originCity}
              />
              <FieldError message={errors.originCity} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="dateRangeStart">
                  {copy.fields.dateRangeStart}
                </label>
                <input
                  className="field-input"
                  id="dateRangeStart"
                  name="dateRangeStart"
                  onChange={(event) => handleInputChange("dateRangeStart", event)}
                  type="date"
                  value={values.dateRangeStart}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="dateRangeEnd">
                  {copy.fields.dateRangeEnd}
                </label>
                <input
                  className="field-input"
                  id="dateRangeEnd"
                  name="dateRangeEnd"
                  onChange={(event) => handleInputChange("dateRangeEnd", event)}
                  type="date"
                  value={values.dateRangeEnd}
                />
                <FieldError message={errors.dateRangeEnd} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="field-label" htmlFor="maxLeaveDays">
                  {copy.fields.maxLeaveDays}
                </label>
                <input
                  className="field-input"
                  id="maxLeaveDays"
                  min={0}
                  name="maxLeaveDays"
                  onChange={(event) => handleInputChange("maxLeaveDays", event)}
                  type="number"
                  value={values.maxLeaveDays}
                />
                <FieldError message={errors.maxLeaveDays} />
              </div>

              <div>
                <label className="field-label" htmlFor="tripLengthMin">
                  {copy.fields.tripLengthMin}
                </label>
                <input
                  className="field-input"
                  id="tripLengthMin"
                  min={1}
                  name="tripLengthMin"
                  onChange={(event) => handleInputChange("tripLengthMin", event)}
                  type="number"
                  value={values.tripLengthMin}
                />
                <FieldError message={errors.tripLengthMin} />
              </div>

              <div>
                <label className="field-label" htmlFor="tripLengthMax">
                  {copy.fields.tripLengthMax}
                </label>
                <input
                  className="field-input"
                  id="tripLengthMax"
                  min={1}
                  name="tripLengthMax"
                  onChange={(event) => handleInputChange("tripLengthMax", event)}
                  type="number"
                  value={values.tripLengthMax}
                />
                <FieldError message={errors.tripLengthMax} />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          description={copy.sections.candidatePool.description}
          eyebrow={copy.sections.candidatePool.eyebrow}
          title={copy.sections.candidatePool.title}
        >
          <div>
            <label className="field-label" htmlFor="destinations">
              {copy.fields.destinations}
            </label>
            <input
              className="field-input"
              id="destinations"
              name="destinations"
              onChange={(event) => handleInputChange("destinations", event)}
              placeholder={copy.placeholders.destinations}
              type="text"
              value={values.destinations}
            />

            <p className="hint-text mt-3">{copy.destinationsHint}</p>
            <FieldError message={errors.destinations} />
          </div>
        </FormSection>

        <FormSection
          description={copy.sections.guardrails.description}
          eyebrow={copy.sections.guardrails.eyebrow}
          title={copy.sections.guardrails.title}
        >
          <div className="space-y-5">
            <div className="rounded-[24px] border border-stone-200 bg-white/[0.82] px-4 py-4">
              <label className="flex items-center gap-3 text-sm font-medium text-stone-800" htmlFor="noRedEye">
                <input
                  checked={values.noRedEye}
                  className="h-4 w-4 rounded border-stone-300 text-stone-950 focus:ring-stone-300"
                  id="noRedEye"
                  name="noRedEye"
                  onChange={(event) => handleInputChange("noRedEye", event)}
                  type="checkbox"
                />
                {copy.noRedEye}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="field-label" htmlFor="maxLayoverHours">
                  {copy.fields.maxLayoverHours}
                </label>
                <input
                  className="field-input"
                  id="maxLayoverHours"
                  min={0}
                  name="maxLayoverHours"
                  onChange={(event) => handleInputChange("maxLayoverHours", event)}
                  step="0.5"
                  type="number"
                  value={values.maxLayoverHours}
                />
                <FieldError message={errors.maxLayoverHours} />
              </div>

              <div>
                <label className="field-label" htmlFor="latestArrivalTime">
                  {copy.fields.latestArrivalTime}
                </label>
                <input
                  className="field-input"
                  id="latestArrivalTime"
                  name="latestArrivalTime"
                  onChange={(event) => handleInputChange("latestArrivalTime", event)}
                  type="time"
                  value={values.latestArrivalTime}
                />
                <FieldError message={errors.latestArrivalTime} />
              </div>

              <div>
                <label className="field-label" htmlFor="earliestReturnTime">
                  {copy.fields.earliestReturnTime}
                </label>
                <input
                  className="field-input"
                  id="earliestReturnTime"
                  name="earliestReturnTime"
                  onChange={(event) => handleInputChange("earliestReturnTime", event)}
                  type="time"
                  value={values.earliestReturnTime}
                />
                <FieldError message={errors.earliestReturnTime} />
              </div>
            </div>
          </div>
        </FormSection>

        {errors.form ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errors.form}
          </div>
        ) : null}

        <div className="sticky bottom-0 z-20 -mx-1 pb-1 pt-3">
          <div className="action-dock">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#c4ab7a]">
                {copy.dockEyebrow}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {copy.dockSummary(
                  destinationList.length || 0,
                  values.tripLengthMin,
                  values.tripLengthMax,
                  values.maxLeaveDays,
                )}
              </p>
            </div>

            <button
              className="inline-flex w-full items-center justify-center rounded-full bg-[#93a895] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#7f957f] disabled:cursor-not-allowed disabled:bg-stone-300 sm:w-auto"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? copy.dockLoading : copy.dockButton}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
