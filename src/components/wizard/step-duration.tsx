"use client";

import type { AppCopy } from "@/lib/i18n";
import type { FormErrors } from "@/lib/wizard/step-validation";

interface StepDurationProps {
  tripLengthMin: string;
  tripLengthMax: string;
  maxLeaveDays: string;
  onChange: (key: "tripLengthMin" | "tripLengthMax" | "maxLeaveDays", value: string) => void;
  fields: AppCopy["form"]["fields"];
  errors: FormErrors;
}

export function StepDuration({
  tripLengthMin,
  tripLengthMax,
  maxLeaveDays,
  onChange,
  fields,
  errors,
}: StepDurationProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <label className="field-label" htmlFor="tripLengthMin">
          {fields.tripLengthMin}
        </label>
        <input
          autoFocus
          className="field-input text-lg"
          id="tripLengthMin"
          min={1}
          name="tripLengthMin"
          onChange={(event) => onChange("tripLengthMin", event.target.value)}
          type="number"
          value={tripLengthMin}
        />
        {errors.tripLengthMin ? (
          <p className="mt-2 text-xs text-rose-600">{errors.tripLengthMin}</p>
        ) : null}
      </div>

      <div>
        <label className="field-label" htmlFor="tripLengthMax">
          {fields.tripLengthMax}
        </label>
        <input
          className="field-input text-lg"
          id="tripLengthMax"
          min={1}
          name="tripLengthMax"
          onChange={(event) => onChange("tripLengthMax", event.target.value)}
          type="number"
          value={tripLengthMax}
        />
        {errors.tripLengthMax ? (
          <p className="mt-2 text-xs text-rose-600">{errors.tripLengthMax}</p>
        ) : null}
      </div>

      <div>
        <label className="field-label" htmlFor="maxLeaveDays">
          {fields.maxLeaveDays}
        </label>
        <input
          className="field-input text-lg"
          id="maxLeaveDays"
          min={0}
          name="maxLeaveDays"
          onChange={(event) => onChange("maxLeaveDays", event.target.value)}
          type="number"
          value={maxLeaveDays}
        />
        {errors.maxLeaveDays ? (
          <p className="mt-2 text-xs text-rose-600">{errors.maxLeaveDays}</p>
        ) : null}
      </div>
    </div>
  );
}
