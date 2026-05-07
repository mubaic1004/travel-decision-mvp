"use client";

interface StepDestinationProps {
  value: string;
  onChange: (value: string) => void;
  fieldLabel: string;
  placeholder: string;
  hint: string;
  fieldError?: string;
}

export function StepDestination({
  value,
  onChange,
  fieldLabel,
  placeholder,
  hint,
  fieldError,
}: StepDestinationProps) {
  return (
    <div>
      <label className="field-label" htmlFor="destinations">
        {fieldLabel}
      </label>
      <input
        autoFocus
        className="field-input text-lg"
        id="destinations"
        name="destinations"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      <p className="hint-text mt-3">{hint}</p>
      {fieldError ? (
        <p className="mt-2 text-xs text-rose-600">{fieldError}</p>
      ) : null}
    </div>
  );
}
