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
      badge: "border-[#c0a16c]/40 bg-[#c0a16c]/15 text-[#d8c08a]",
      accent: "bg-[#c0a16c]",
    };
  }

  if (title === "Least Leave Option" || title === "请假最少方案") {
    return {
      badge: "border-[#8aa088]/40 bg-[#8aa088]/15 text-[#a8c0a4]",
      accent: "bg-[#8aa088]",
    };
  }

  return {
    badge: "border-[#8fa1ab]/40 bg-[#8fa1ab]/15 text-[#adc0ca]",
    accent: "bg-[#8fa1ab]",
  };
}

const CARD_PANEL =
  "relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm";

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</dt>
      <dd className="mt-2 text-base font-normal text-white">{value}</dd>
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
    <article className={CARD_PANEL}>
      <div className={`absolute inset-x-0 top-0 h-[2px] ${theme.accent}`} />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${theme.badge}`}>
            {title}
          </span>
          <span className="text-sm tracking-[0.28em] text-white/40">{sequence}</span>
        </div>

        <div className="mt-6 h-px w-full bg-white/10" />
        <h3 className="mt-7 text-2xl font-normal tracking-tight text-white">
          {copy.emptyTitle}
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/50">{copy.emptyDescription}</p>
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
    <article className={CARD_PANEL}>
      <div className={`absolute inset-x-0 top-0 h-[2px] ${theme.accent}`} />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${theme.badge}`}>
                {title}
              </span>
              <span className="text-sm tracking-[0.28em] text-white/40">{sequence}</span>
            </div>

            <h3 className="mt-6 text-[2.15rem] font-normal tracking-tight text-white">
              {option.destination}
            </h3>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/50">{subtitle}</p>
          </div>

          <div className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/50">
            {copy.curated}
          </div>
        </div>

        <div className="mt-6 h-px w-full bg-white/10" />

        <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{copy.totalPrice}</p>
              <p className="mt-2 text-[2.1rem] font-normal tracking-tight text-white">
                {formatCurrencyForLocale(option.totalPrice, locale)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{copy.costPerHour}</p>
              <p className="mt-2 text-xl font-normal tracking-tight text-white">
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

        <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              {copy.flightSummary}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {buildFlightSummary(option, locale)}
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              {copy.hotelSummary}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {buildHotelSummary(option, locale)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
