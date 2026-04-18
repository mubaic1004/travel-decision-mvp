import {
  buildFlightSummary,
  buildHotelSummary,
  formatCurrencyForLocale,
  formatDaysLabel,
  formatDisplayDateForLocale,
  formatHoursLabel,
  type AppCopy,
  type Locale,
} from "@/lib/i18n";
import type { RankedTripOption } from "@/types/travel";

interface ResultCardProps {
  title: string;
  subtitle: string;
  shortLabel: string;
  option: RankedTripOption | null;
  sequence: string;
  locale: Locale;
  copy: AppCopy["card"];
}

function getTheme(title: string) {
  if (title === "Cheapest Option" || title === "最省钱方案") {
    return {
      badge: "border-[#d8c7a5] bg-[#f4ead8] text-[#806640]",
      accent: "bg-[#c0a16c]",
      panel: "bg-[linear-gradient(180deg,rgba(255,251,245,0.96)_0%,rgba(249,243,232,0.84)_100%)]",
    };
  }

  if (title === "Least Leave Option" || title === "请假最少方案") {
    return {
      badge: "border-[#cfd7cf] bg-[#ebefea] text-[#5f685d]",
      accent: "bg-[#7d8776]",
      panel: "bg-[linear-gradient(180deg,rgba(253,253,251,0.96)_0%,rgba(241,245,239,0.84)_100%)]",
    };
  }

  return {
    badge: "border-[#d1d8db] bg-[#edf1f2] text-[#60707a]",
    accent: "bg-[#8fa1ab]",
    panel: "bg-[linear-gradient(180deg,rgba(252,253,253,0.96)_0%,rgba(239,243,245,0.84)_100%)]",
  };
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-stone-200/80 bg-white/[0.8] p-4">
      <dt className="text-[11px] uppercase tracking-[0.22em] text-stone-500">{label}</dt>
      <dd className="mt-2 text-base font-medium text-stone-950">{value}</dd>
    </div>
  );
}

function EmptyCard({
  title,
  sequence,
  theme,
  copy,
}: {
  title: string;
  sequence: string;
  theme: ReturnType<typeof getTheme>;
  copy: AppCopy["card"];
}) {
  return (
    <article className={`panel relative overflow-hidden border-stone-200/80 p-6 ${theme.panel}`}>
      <div className={`absolute inset-x-0 top-0 h-[3px] ${theme.accent}`} />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${theme.badge}`}>
            {title}
          </span>
          <span className="text-sm tracking-[0.28em] text-stone-500">{sequence}</span>
        </div>

        <div className="mt-6 luxury-rule" />
        <h3 className="mt-7 text-2xl font-semibold tracking-tight text-stone-950">
          {copy.emptyTitle}
        </h3>
        <p className="mt-3 text-sm leading-6 text-stone-600">{copy.emptyDescription}</p>
      </div>
    </article>
  );
}

export function ResultCard({
  title,
  subtitle,
  shortLabel,
  option,
  sequence,
  locale,
  copy,
}: ResultCardProps) {
  const theme = getTheme(title);

  if (!option) {
    return <EmptyCard copy={copy} sequence={sequence} theme={theme} title={title} />;
  }

  return (
    <article className={`panel relative flex h-full flex-col overflow-hidden border-stone-200/80 p-6 ${theme.panel}`}>
      <div className={`absolute inset-x-0 top-0 h-[3px] ${theme.accent}`} />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${theme.badge}`}>
                {title}
              </span>
              <span className="text-sm tracking-[0.28em] text-stone-500">{sequence}</span>
            </div>

            <h3 className="mt-6 text-[2.15rem] font-semibold tracking-tight text-stone-950">
              {option.destination}
            </h3>
            <p className="mt-3 max-w-xs text-sm leading-6 text-stone-600">{subtitle}</p>
          </div>

          <div className="rounded-full border border-stone-300 bg-white/[0.72] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-stone-600">
            {copy.curated}
          </div>
        </div>

        <div className="mt-6 luxury-rule" />

        <div className="mt-7 rounded-[30px] border border-stone-200/80 bg-white/[0.64] p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">{copy.totalPrice}</p>
              <p className="mt-2 text-[2.1rem] font-semibold tracking-tight text-stone-950">
                {formatCurrencyForLocale(option.totalPrice, locale)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">{copy.costPerHour}</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-stone-950">
                {formatCurrencyForLocale(option.pricePerEffectiveHour, locale, 2)}
              </p>
            </div>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <Metric label={copy.depart} value={formatDisplayDateForLocale(option.departDate, locale)} />
          <Metric label={copy.return} value={formatDisplayDateForLocale(option.returnDate, locale)} />
          <Metric label={copy.leaveDays} value={formatDaysLabel(option.leaveDaysUsed, locale)} />
          <Metric label={copy.tripDays} value={formatDaysLabel(option.totalTripDays, locale)} />
          <Metric
            label={copy.effectivePlay}
            value={formatHoursLabel(option.effectivePlayHours, locale, 1)}
          />
          <Metric label={copy.travelLens} value={shortLabel} />
        </dl>

        <div className="mt-6 space-y-4 border-t border-stone-200/90 pt-5">
          <div className="rounded-[24px] border border-stone-200/80 bg-white/[0.8] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
              {copy.flightSummary}
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {buildFlightSummary(option, locale)}
            </p>
          </div>

          <div className="rounded-[24px] border border-stone-200/80 bg-white/[0.8] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
              {copy.hotelSummary}
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {buildHotelSummary(option, locale)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
