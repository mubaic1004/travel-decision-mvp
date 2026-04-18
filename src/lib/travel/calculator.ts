import type { MatchedTripOption, RankedTripOption } from "@/types/travel";

import { pricingRules } from "@/lib/travel/pricing-rules";
import {
  addDays,
  extractTime,
  formatCurrency,
  formatDisplayDateTime,
  timeToMinutes,
  toLocalDateTime,
} from "@/lib/travel/utils";

function getStopsLabel(stops: number): string {
  if (stops === 0) {
    return "Direct";
  }

  return `${stops} stop${stops > 1 ? "s" : ""}`;
}

export function calcEffectivePlayHours(
  arrivalDateTime: string | Date,
  returnDepartureDateTime: string | Date,
): number {
  const arrival =
    arrivalDateTime instanceof Date
      ? arrivalDateTime
      : toLocalDateTime(arrivalDateTime);
  const returnDeparture =
    returnDepartureDateTime instanceof Date
      ? returnDepartureDateTime
      : toLocalDateTime(returnDepartureDateTime);

  if (returnDeparture <= arrival) {
    return 0;
  }

  let totalMinutes = 0;
  let cursor = new Date(arrival);
  cursor.setHours(0, 0, 0, 0);

  const end = new Date(returnDeparture);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const dayWindowStart = new Date(cursor);
    dayWindowStart.setHours(9, 0, 0, 0);

    const dayWindowEnd = new Date(cursor);
    dayWindowEnd.setHours(22, 0, 0, 0);

    const segmentStart = arrival > dayWindowStart ? arrival : dayWindowStart;
    const segmentEnd = returnDeparture < dayWindowEnd ? returnDeparture : dayWindowEnd;

    if (segmentEnd > segmentStart) {
      totalMinutes += (segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 60);
    }

    cursor = addDays(cursor, 1);
  }

  return Math.round((totalMinutes / 60) * 10) / 10;
}

function calcExperiencePenaltyScore(option: MatchedTripOption): number {
  const { flight } = option;
  if (!flight) {
    return 0;
  }

  const rules = pricingRules.experience_penalty_rules;
  const arrivalMinutes = timeToMinutes(extractTime(flight.outboundArrival));
  const returnDepartureMinutes = timeToMinutes(extractTime(flight.returnDeparture));
  let score = 0;

  if (arrivalMinutes > 21 * 60) {
    score += rules.arrival_after_21_00;
  } else if (arrivalMinutes > 20 * 60) {
    score += rules.arrival_after_20_00;
  }

  if (returnDepartureMinutes < 9 * 60) {
    score += rules.return_before_09_00;
  } else if (returnDepartureMinutes < 10 * 60) {
    score += rules.return_before_10_00;
  }

  if (flight.stops >= 2) {
    score += rules.two_stops;
  } else if (flight.stops === 1) {
    score += rules.one_stop;
  }

  if (flight.layoverHours > 3) {
    score += rules.layover_over_3h;
  } else if (flight.layoverHours > 2) {
    score += rules.layover_over_2h;
  }

  return score;
}

export function buildRankedTripOption(
  matchedTrip: MatchedTripOption,
): RankedTripOption | null {
  const { candidateTrip, flight, hotel } = matchedTrip;

  if (
    !flight ||
    !hotel ||
    flight.flightTotalPrice === null ||
    hotel.hotelTotalPrice === null ||
    hotel.hotelAvgPricePerNight === null
  ) {
    return null;
  }

  const totalPrice = flight.flightTotalPrice + hotel.hotelTotalPrice;
  const effectivePlayHours = calcEffectivePlayHours(
    flight.outboundArrival,
    flight.returnDeparture,
  );

  if (effectivePlayHours <= 0) {
    return null;
  }

  const experiencePenaltyScore = calcExperiencePenaltyScore(matchedTrip);
  const pricePerEffectiveHour =
    Math.round((totalPrice / effectivePlayHours) * 100) / 100;

  return {
    id: `${flight.id}-${hotel.id}`,
    ...candidateTrip,
    flight,
    hotel,
    totalPrice,
    effectivePlayHours,
    pricePerEffectiveHour,
    experiencePenaltyScore,
    pricePerEffectiveHourWithPenalty:
      Math.round((pricePerEffectiveHour + experiencePenaltyScore) * 100) / 100,
    flightSummary: `${flight.label} · ${getStopsLabel(flight.stops)} · outbound ${extractTime(
      flight.outboundDeparture,
    )} → ${extractTime(flight.outboundArrival)} · return ${extractTime(
      flight.returnDeparture,
    )} → ${extractTime(flight.returnArrival)} · layover ${flight.layoverHours}h · ${formatCurrency(
      flight.flightTotalPrice,
    )}`,
    hotelSummary: `${hotel.hotelName} · ${hotel.hotelNights} night${
      hotel.hotelNights > 1 ? "s" : ""
    } · avg ${formatCurrency(hotel.hotelAvgPricePerNight)}/night · ${formatCurrency(
      hotel.hotelTotalPrice,
    )}`,
  };
}

export function buildResultTimestampLabel(option: RankedTripOption): string {
  return `${formatDisplayDateTime(option.flight.outboundDeparture)} → ${formatDisplayDateTime(
    option.flight.returnDeparture,
  )}`;
}
