import type { CandidateTrip, SearchInput } from "@/types/travel";

import {
  addDays,
  diffDaysInclusive,
  formatDateInput,
  listWeekdayDates,
  normalizeText,
  toLocalDate,
} from "@/lib/travel/utils";

export function generateCandidateTrips(input: SearchInput): CandidateTrip[] {
  const startDate = toLocalDate(input.dateRangeStart);
  const endDate = toLocalDate(input.dateRangeEnd);
  const uniqueDestinations = Array.from(
    new Set(input.destinations.map((destination) => destination.trim()).filter(Boolean)),
  );
  const candidates: CandidateTrip[] = [];

  for (const destination of uniqueDestinations) {
    if (!normalizeText(destination)) {
      continue;
    }

    for (
      let departDate = new Date(startDate);
      departDate <= endDate;
      departDate = addDays(departDate, 1)
    ) {
      for (
        let tripLength = input.tripLengthMin;
        tripLength <= input.tripLengthMax;
        tripLength += 1
      ) {
        const returnDate = addDays(departDate, tripLength - 1);

        if (returnDate > endDate) {
          continue;
        }

        const leaveDates = listWeekdayDates(departDate, returnDate);
        if (leaveDates.length > input.maxLeaveDays) {
          continue;
        }

        candidates.push({
          destination,
          departDate: formatDateInput(departDate),
          returnDate: formatDateInput(returnDate),
          leaveDates,
          totalTripDays: diffDaysInclusive(departDate, returnDate),
          leaveDaysUsed: leaveDates.length,
        });
      }
    }
  }

  return candidates;
}
