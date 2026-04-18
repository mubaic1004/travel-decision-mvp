import type { RankedTripOption, SearchInput } from "@/types/travel";

import { pricingRules } from "@/lib/travel/pricing-rules";
import { extractTime, timeToMinutes } from "@/lib/travel/utils";

export function filterRankedTripOptions(
  options: RankedTripOption[],
  input: SearchInput,
): RankedTripOption[] {
  const latestArrivalMinutes = timeToMinutes(input.filters.latestArrivalTime);
  const earliestReturnMinutes = timeToMinutes(input.filters.earliestReturnTime);

  return options.filter((option) => {
    const arrivalMinutes = timeToMinutes(extractTime(option.flight.outboundArrival));
    const returnDepartureMinutes = timeToMinutes(
      extractTime(option.flight.returnDeparture),
    );

    if (arrivalMinutes > latestArrivalMinutes) {
      return false;
    }

    if (returnDepartureMinutes < earliestReturnMinutes) {
      return false;
    }

    if (option.flight.layoverHours > input.filters.maxLayoverHours) {
      return false;
    }

    if (input.filters.noRedEye && option.flight.isRedEye) {
      return false;
    }

    if (!Number.isFinite(option.totalPrice) || !Number.isFinite(option.hotel.hotelTotalPrice)) {
      return false;
    }

    if (option.effectivePlayHours < pricingRules.effective_time_rules.min_effective_play_hours) {
      return false;
    }

    return true;
  });
}
