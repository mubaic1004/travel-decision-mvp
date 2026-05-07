"use client";

import type { AppCopy } from "@/lib/i18n";
import type { FormErrors } from "@/lib/wizard/step-validation";

interface StepPreferencesProps {
  noRedEye: boolean;
  maxLayoverHours: string;
  latestArrivalTime: string;
  earliestReturnTime: string;
  onChange: <Key extends "noRedEye" | "maxLayoverHours" | "latestArrivalTime" | "earliestReturnTime">(
    key: Key,
    value: Key extends "noRedEye" ? boolean : string,
  ) => void;
  fields: AppCopy["form"]["fields"];
  noRedEyeLabel: string;
  errors: FormErrors;
}

export function StepPreferences({
  noRedEye,
  maxLayoverHours,
  latestArrivalTime,
  earliestReturnTime,
  onChange,
  fields,
  noRedEyeLabel,
  errors,
}: StepPreferencesProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-stone-200 bg-white/[0.82] px-4 py-4">
        <label className="flex items-center gap-3 text-sm font-medium text-stone-800" htmlFor="noRedEye">
          <input
            checked={noRedEye}
            className="h-4 w-4 rounded border-stone-300 text-stone-950 focus:ring-stone-300"
            id="noRedEye"
            name="noRedEye"
            onChange={(event) => onChange("noRedEye", event.target.checked)}
            type="checkbox"
          />
          {noRedEyeLabel}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="maxLayoverHours">
            {fields.maxLayoverHours}
          </label>
          <input
            className="field-input text-lg"
            id="maxLayoverHours"
            min={0}
            name="maxLayoverHours"
            onChange={(event) => onChange("maxLayoverHours", event.target.value)}
            step="0.5"
            type="number"
            value={maxLayoverHours}
          />
          {errors.maxLayoverHours ? (
            <p className="mt-2 text-xs text-rose-600">{errors.maxLayoverHours}</p>
          ) : null}
        </div>

        <div>
          <label className="field-label" htmlFor="latestArrivalTime">
            {fields.latestArrivalTime}
          </label>
          <input
            className="field-input text-lg"
            id="latestArrivalTime"
            name="latestArrivalTime"
            onChange={(event) => onChange("latestArrivalTime", event.target.value)}
            type="time"
            value={latestArrivalTime}
          />
          {errors.latestArrivalTime ? (
            <p className="mt-2 text-xs text-rose-600">{errors.latestArrivalTime}</p>
          ) : null}
        </div>

        <div>
          <label className="field-label" htmlFor="earliestReturnTime">
            {fields.earliestReturnTime}
          </label>
          <input
            className="field-input text-lg"
            id="earliestReturnTime"
            name="earliestReturnTime"
            onChange={(event) => onChange("earliestReturnTime", event.target.value)}
            type="time"
            value={earliestReturnTime}
          />
          {errors.earliestReturnTime ? (
            <p className="mt-2 text-xs text-rose-600">{errors.earliestReturnTime}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
