"use client";

import type { AppCopy } from "@/lib/i18n";

interface StepDatesProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  fields: AppCopy["form"]["fields"];
  endError?: string;
}

export function StepDates({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  fields,
  endError,
}: StepDatesProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="field-label" htmlFor="dateRangeStart">
          {fields.dateRangeStart}
        </label>
        <input
          autoFocus
          className="field-input text-lg"
          id="dateRangeStart"
          name="dateRangeStart"
          onChange={(event) => onStartChange(event.target.value)}
          type="date"
          value={startValue}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="dateRangeEnd">
          {fields.dateRangeEnd}
        </label>
        <input
          className="field-input text-lg"
          id="dateRangeEnd"
          name="dateRangeEnd"
          onChange={(event) => onEndChange(event.target.value)}
          type="date"
          value={endValue}
        />
        {endError ? (
          <p className="mt-2 text-xs text-rose-600">{endError}</p>
        ) : null}
      </div>
    </div>
  );
}
