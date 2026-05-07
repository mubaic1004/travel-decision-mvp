import type { AppCopy } from "@/lib/i18n";
import { diffDaysInclusive, toLocalDate } from "@/lib/travel/utils";
import type { SearchFormValues, SearchInput } from "@/types/travel";

export type FormErrors = Partial<Record<keyof SearchFormValues | "form", string>>;

export type StepKey = "origin" | "destination" | "dates" | "duration" | "preferences";

export const STEP_ORDER: StepKey[] = [
  "origin",
  "destination",
  "dates",
  "duration",
  "preferences",
];

export function validateStep(
  step: StepKey,
  values: SearchFormValues,
  copy: AppCopy["form"],
): FormErrors {
  const errors: FormErrors = {};
  const messages = copy.validation;

  if (step === "origin") {
    if (!values.originCity.trim()) {
      errors.originCity = messages.originCityRequired;
    }
  }

  if (step === "destination") {
    const destinations = values.destinations
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (destinations.length === 0) {
      errors.destinations = messages.destinations;
    }
  }

  if (step === "dates") {
    if (!values.dateRangeStart || !values.dateRangeEnd) {
      errors.form = messages.dateWindowRequired;
    } else if (values.dateRangeStart > values.dateRangeEnd) {
      errors.dateRangeEnd = messages.dateRangeEnd;
    }
  }

  if (step === "duration") {
    const maxLeaveDays = Number(values.maxLeaveDays);
    const tripLengthMin = Number(values.tripLengthMin);
    const tripLengthMax = Number(values.tripLengthMax);

    if (!Number.isFinite(maxLeaveDays) || maxLeaveDays < 0) {
      errors.maxLeaveDays = messages.maxLeaveDays;
    }
    if (!Number.isFinite(tripLengthMin) || tripLengthMin < 1) {
      errors.tripLengthMin = messages.tripLengthMin;
    }
    if (!Number.isFinite(tripLengthMax) || tripLengthMax < 1) {
      errors.tripLengthMax = messages.tripLengthMax;
    }
    if (
      Number.isFinite(tripLengthMin) &&
      Number.isFinite(tripLengthMax) &&
      tripLengthMin > tripLengthMax
    ) {
      errors.tripLengthMax = messages.tripLengthRange;
    }

    if (
      values.dateRangeStart &&
      values.dateRangeEnd &&
      Number.isFinite(tripLengthMin)
    ) {
      const availableDays = diffDaysInclusive(
        toLocalDate(values.dateRangeStart),
        toLocalDate(values.dateRangeEnd),
      );
      if (availableDays < tripLengthMin) {
        errors.form = messages.dateWindowTooShort;
      }
    }
  }

  if (step === "preferences") {
    const maxLayoverHours = Number(values.maxLayoverHours);
    if (!Number.isFinite(maxLayoverHours) || maxLayoverHours < 0) {
      errors.maxLayoverHours = messages.layoverHours;
    }
    if (!values.latestArrivalTime) {
      errors.latestArrivalTime = messages.latestArrivalTime;
    }
    if (!values.earliestReturnTime) {
      errors.earliestReturnTime = messages.earliestReturnTime;
    }
  }

  return errors;
}

export function validateAll(
  values: SearchFormValues,
  copy: AppCopy["form"],
): FormErrors {
  return STEP_ORDER.reduce<FormErrors>((acc, step) => {
    return { ...acc, ...validateStep(step, values, copy) };
  }, {});
}

export function toSearchInput(values: SearchFormValues): SearchInput {
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
