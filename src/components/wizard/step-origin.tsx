"use client";

import type { AppCopy } from "@/lib/i18n";

interface StepOriginProps {
  value: string;
  onChange: (value: string) => void;
  fieldLabel: string;
  placeholder: string;
  fieldError?: string;
  formCopy: AppCopy["form"];
}

export function StepOrigin({
  value,
  onChange,
  fieldLabel,
  placeholder,
  fieldError,
}: StepOriginProps) {
  return (
    <div>
      <label className="field-label" htmlFor="originCity">
        {fieldLabel}
      </label>
      <input
        autoFocus
        className="field-input text-lg"
        id="originCity"
        name="originCity"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      {fieldError ? (
        <p className="mt-2 text-xs text-rose-600">{fieldError}</p>
      ) : null}
    </div>
  );
}
