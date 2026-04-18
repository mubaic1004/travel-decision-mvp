import type { RankedTripOption, SearchResult } from "@/types/travel";

function compareCheapest(a: RankedTripOption, b: RankedTripOption): number {
  return (
    a.totalPrice - b.totalPrice ||
    a.pricePerEffectiveHour - b.pricePerEffectiveHour ||
    a.leaveDaysUsed - b.leaveDaysUsed
  );
}

function compareLeastLeave(a: RankedTripOption, b: RankedTripOption): number {
  return (
    a.leaveDaysUsed - b.leaveDaysUsed ||
    a.totalPrice - b.totalPrice ||
    a.pricePerEffectiveHour - b.pricePerEffectiveHour
  );
}

function compareBestValue(a: RankedTripOption, b: RankedTripOption): number {
  return (
    a.pricePerEffectiveHourWithPenalty - b.pricePerEffectiveHourWithPenalty ||
    a.pricePerEffectiveHour - b.pricePerEffectiveHour ||
    a.totalPrice - b.totalPrice ||
    a.leaveDaysUsed - b.leaveDaysUsed
  );
}

export function rankTripOptions(options: RankedTripOption[]): SearchResult {
  const cheapest = [...options].sort(compareCheapest);
  const leastLeave = [...options].sort(compareLeastLeave);
  const bestValue = [...options].sort(compareBestValue);

  return {
    cheapestOption: cheapest[0] ?? null,
    leastLeaveOption: leastLeave[0] ?? null,
    bestValueOption: bestValue[0] ?? null,
    evaluatedOptions: bestValue,
  };
}
