import type {
  CandidateTrip,
  FlightOption,
  FlightTimeTemplateRule,
  HotelOption,
  HotelPricingRule,
  MatchedTripOption,
  ReturnTimeTemplateRule,
  RoutePricingRule,
  SearchInput,
  SupportedDestinationRule,
} from "@/types/travel";

import { pricingRules } from "@/lib/travel/pricing-rules";
import {
  CITIES,
  type CityMeta,
  distanceKm,
  resolveCity,
} from "@/lib/travel/cities";
import {
  addDays,
  formatDateInput,
  hashString,
  toLocalDate,
  timeToMinutes,
} from "@/lib/travel/utils";

const HOLIDAY_ANCHORS: Record<number, string[]> = {
  2025: [
    "2025-01-01",
    "2025-01-29",
    "2025-04-04",
    "2025-05-01",
    "2025-05-31",
    "2025-10-01",
    "2025-10-06",
  ],
  2026: [
    "2026-01-01",
    "2026-02-17",
    "2026-04-05",
    "2026-05-01",
    "2026-06-19",
    "2026-09-25",
    "2026-10-01",
  ],
  2027: [
    "2027-01-01",
    "2027-02-06",
    "2027-04-05",
    "2027-05-01",
    "2027-06-09",
    "2027-09-15",
    "2027-10-01",
  ],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getWeekdayKey(date: Date): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

function getMonthKey(date: Date): string {
  return String(date.getMonth() + 1).padStart(2, "0");
}

function buildLocalDateTime(dateString: string, timeString: string): Date {
  const date = toLocalDate(dateString);
  const [hours, minutes] = timeString.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatLocalDateTime(date: Date): string {
  return `${formatDateInput(date)}T${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function seededInteger(seedKey: string, min: number, max: number): number {
  if (max <= min) {
    return min;
  }

  let seed = hashString(seedKey) + 1;
  seed = (seed * 9301 + 49297) % 233280;
  const ratio = seed / 233280;
  return Math.round(min + ratio * (max - min));
}

// Synthesize a route on-the-fly when the origin/destination pair isn't curated
// in pricing-rules.json. Calibrated roughly against the existing Shanghai
// curated data so the relative ranking (cheapest/medium/long-haul) stays sensible.
function synthesizeRoute(
  origin: CityMeta,
  destination: CityMeta,
): { route: RoutePricingRule; departureGroup: string; returnGroup: string } {
  const distance = distanceKm(origin, destination);
  const isInternational =
    origin.regionType === "international" ||
    destination.regionType === "international";

  let basePrice: number;
  let durationHours: number;
  let departureGroup: string;

  if (!isInternational) {
    basePrice = 450 + distance * 0.5;
    durationHours = Math.max(1, distance / 800 + 0.5);
    departureGroup = distance < 1500 ? "china_short_haul" : "china_medium_haul";
  } else if (distance < 3500) {
    basePrice = 2200 + distance * 0.85;
    durationHours = Math.max(1.5, distance / 850 + 0.6);
    departureGroup = "asia_short_haul";
  } else if (distance < 7500) {
    basePrice = 3200 + distance * 0.7;
    durationHours = distance / 880 + 1.0;
    departureGroup = "asia_medium_haul";
  } else {
    basePrice = 4500 + distance * 0.65;
    durationHours = distance / 900 + 1.5;
    departureGroup = "international_long_haul";
  }

  // Tier premium/discount: hub-to-hub cheaper, secondary routes pricier.
  const avgTier = (origin.tier + destination.tier) / 2;
  if (avgTier <= 1.5) {
    basePrice *= 0.92;
  } else if (avgTier >= 2.5) {
    basePrice *= 1.18;
  }

  basePrice = Math.round(basePrice / 50) * 50;
  const flightTypicalMin = Math.max(300, Math.round((basePrice * 0.65) / 50) * 50);
  const flightTypicalMax = Math.round((basePrice * 1.95) / 50) * 50;
  const returnGroup = distance > 6000 ? "default_long" : "default_short";

  return {
    route: {
      origin: origin.code,
      destination: destination.code,
      region_type: isInternational ? "international" : "domestic",
      flight_base_price: basePrice,
      flight_typical_min: flightTypicalMin,
      flight_typical_max: flightTypicalMax,
      flight_duration_hours: Number(durationHours.toFixed(1)),
      nonstop_ratio: distance < 4000 ? 0.85 : 0.5,
      template_group: departureGroup,
    },
    departureGroup,
    returnGroup,
  };
}

function destinationRuleFromCity(
  origin: CityMeta,
  city: CityMeta,
): SupportedDestinationRule {
  return {
    city_code: city.code,
    city_name: city.name,
    country_code: city.countryCode,
    country_name: city.countryCode,
    region_type: city.regionType,
    route_key: `${origin.code}-${city.code}`,
    hotel_key: city.hotelKey,
  };
}

function getDestinationDisplayName(
  rawDestination: string,
  destination: CityMeta,
): string {
  const trimmed = rawDestination.trim();
  if (!trimmed) {
    return destination.name;
  }
  if (trimmed.toLowerCase() === destination.code.toLowerCase()) {
    return destination.name;
  }
  return trimmed;
}

function getFlightDurationMinutes(template: FlightTimeTemplateRule): number {
  return Math.round(template.arrival_time_offset_hours * 60);
}

function getDaysBeforeDeparture(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const departureDate = toLocalDate(dateString);
  return Math.max(
    0,
    Math.floor((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function getRangeAdjustment(
  value: number,
  ranges: Array<{ min_days_before?: number; max_days_before?: number; nights?: number; adjustment: number }>,
): number {
  for (const range of ranges) {
    const min = range.min_days_before ?? range.nights ?? Number.NEGATIVE_INFINITY;
    const max = range.max_days_before ?? range.nights ?? Number.POSITIVE_INFINITY;

    if (value >= min && value <= max) {
      return range.adjustment;
    }
  }

  return 0;
}

function getSeasonBucket(
  date: Date,
  regionType: "domestic" | "international",
):
  | "major_holiday_window"
  | "summer_peak"
  | "winter_peak"
  | "shoulder_season"
  | "low_season" {
  if (isInHolidayWindow(date)) {
    return "major_holiday_window";
  }

  const month = date.getMonth() + 1;
  if (month >= 7 && month <= 8) {
    return "summer_peak";
  }

  if (month === 12 || month <= 2) {
    return "winter_peak";
  }

  if ((regionType === "international" && (month === 3 || month === 11)) || month === 6) {
    return "low_season";
  }

  return "shoulder_season";
}

function isInHolidayWindow(date: Date): boolean {
  const anchors = HOLIDAY_ANCHORS[date.getFullYear()] ?? [];
  const windowDays = pricingRules.holiday_rules.holiday_window_days;

  return anchors.some((anchor) => {
    const anchorDate = toLocalDate(anchor);
    const diff = Math.abs(date.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= windowDays;
  });
}

function getFlightQualityAdjustment(
  outboundTemplate: FlightTimeTemplateRule,
  outboundArrival: Date,
  returnTemplate: ReturnTimeTemplateRule,
  isRedEye: boolean,
): number {
  const rules = pricingRules.flight_price_rules.quality_adjustment;
  let adjustment = 0;

  if (outboundTemplate.stops === 0) {
    adjustment += rules.nonstop ?? 0;
  } else if (outboundTemplate.stops === 1) {
    adjustment += rules.one_stop ?? 0;
  } else {
    adjustment += rules.two_stops ?? 0;
  }

  if (isRedEye) {
    adjustment += rules.red_eye ?? 0;
  }

  const departureMinutes = timeToMinutes(outboundTemplate.depart_time);
  if (departureMinutes >= 11 * 60 && departureMinutes <= 14 * 60 + 59) {
    adjustment += rules.midday_departure ?? 0;
  }

  const arrivalMinutes = outboundArrival.getHours() * 60 + outboundArrival.getMinutes();
  if (arrivalMinutes >= 20 * 60) {
    adjustment += rules.late_evening_arrival ?? 0;
  }

  const returnMinutes = timeToMinutes(returnTemplate.depart_time);
  if (returnMinutes >= 15 * 60 && returnMinutes <= 20 * 60) {
    adjustment += rules.prime_return_window ?? 0;
  }

  return adjustment;
}

function getFlightHolidayAdjustment(departDate: Date, returnDate: Date): number {
  let adjustment = 0;

  if (isInHolidayWindow(departDate)) {
    adjustment += pricingRules.holiday_rules.pre_holiday_departure_surcharge;
  }

  if (isInHolidayWindow(returnDate)) {
    adjustment += pricingRules.holiday_rules.last_day_return_surcharge;
  }

  return adjustment;
}

function getFlightPrice(
  route: RoutePricingRule,
  trip: CandidateTrip,
  outboundTemplate: FlightTimeTemplateRule,
  returnTemplate: ReturnTimeTemplateRule,
  outboundArrival: Date,
  isRedEye: boolean,
): number {
  const departDate = toLocalDate(trip.departDate);
  const returnDate = toLocalDate(trip.returnDate);
  const daysBeforeDeparture = getDaysBeforeDeparture(trip.departDate);
  const seasonBucket = getSeasonBucket(departDate, route.region_type);
  const seasonalityAdjustment = pricingRules.seasonality_rules[route.region_type][seasonBucket];
  const departureWeekdayAdjustment =
    pricingRules.flight_price_rules.departure_weekday_adjustment[getWeekdayKey(departDate)] ?? 0;
  const returnWeekdayAdjustment =
    pricingRules.flight_price_rules.return_weekday_adjustment[getWeekdayKey(returnDate)] ?? 0;
  const bookingWindowAdjustment = getRangeAdjustment(
    daysBeforeDeparture,
    pricingRules.flight_price_rules.booking_window_adjustment,
  );
  const qualityAdjustment = getFlightQualityAdjustment(
    outboundTemplate,
    outboundArrival,
    returnTemplate,
    isRedEye,
  );
  const holidayAdjustment = getFlightHolidayAdjustment(departDate, returnDate);
  const regionMultiplier =
    pricingRules.flight_price_rules.region_multiplier[route.region_type] ?? 1;
  const randomNoise = seededInteger(
    `${route.origin}-${route.destination}-${trip.departDate}-${trip.returnDate}-${outboundTemplate.template_id}-${returnTemplate.template_id}-flight`,
    pricingRules.flight_price_rules.random_noise_range.min,
    pricingRules.flight_price_rules.random_noise_range.max,
  );

  let price =
    Math.round(route.flight_base_price * regionMultiplier) +
    departureWeekdayAdjustment +
    returnWeekdayAdjustment +
    bookingWindowAdjustment +
    qualityAdjustment +
    seasonalityAdjustment +
    holidayAdjustment +
    randomNoise;

  if (pricingRules.price_clamp_rules.flight_must_clamp_to_typical_range) {
    price = clamp(price, route.flight_typical_min, route.flight_typical_max);
  }

  return Math.round(price);
}

function getReturnArrival(
  trip: CandidateTrip,
  returnTemplate: ReturnTimeTemplateRule,
  durationMinutes: number,
): Date {
  const departureDateTime = buildLocalDateTime(trip.returnDate, returnTemplate.depart_time);
  return addMinutes(departureDateTime, durationMinutes);
}

function getHotelLengthOfStayAdjustment(nights: number): number {
  const matchingRule =
    pricingRules.hotel_price_rules.length_of_stay_adjustment_per_night.find(
      (rule) => rule.nights === nights,
    ) ??
    pricingRules.hotel_price_rules.length_of_stay_adjustment_per_night[
      pricingRules.hotel_price_rules.length_of_stay_adjustment_per_night.length - 1
    ];

  return matchingRule?.adjustment ?? 0;
}

function getHotelName(destination: SupportedDestinationRule): string {
  const suffixes = ["House", "Suites", "Stay"];
  const suffix = suffixes[hashString(destination.city_code) % suffixes.length];
  return `${destination.city_name} ${suffix}`;
}

// Synthesize a hotel pricing rule for cities not present in pricing-rules.json
// (right now only Shanghai falls in this gap, since it was originally an origin only).
function synthesizeHotelRule(city: CityMeta): HotelPricingRule {
  const tierBase: Record<1 | 2 | 3, number> = { 1: 720, 2: 540, 3: 420 };
  const intlBoost = city.regionType === "international" ? 1.45 : 1;
  const baseNightly = Math.round((tierBase[city.tier] * intlBoost) / 10) * 10;
  return {
    base_nightly: baseNightly,
    typical_min: Math.round((baseNightly * 0.6) / 10) * 10,
    typical_max: Math.round((baseNightly * 2.0) / 10) * 10,
  };
}

function getHotelOption(
  trip: CandidateTrip,
  destination: SupportedDestinationRule,
  destCity: CityMeta,
  displayDestination: string,
): HotelOption {
  const hotelRule =
    (pricingRules.hotels[destination.hotel_key] as HotelPricingRule | undefined) ??
    synthesizeHotelRule(destCity);
  const hotelNights = Math.max(1, trip.totalTripDays - 1);
  const lengthAdjustment = getHotelLengthOfStayAdjustment(hotelNights);
  let hotelTotalPrice = 0;

  for (let nightOffset = 0; nightOffset < hotelNights; nightOffset += 1) {
    const nightDate = addDays(toLocalDate(trip.departDate), nightOffset);
    const weekdayKey = getWeekdayKey(nightDate);
    const seasonBucket = getSeasonBucket(nightDate, destination.region_type);
    const specialDestinationAdjustment =
      pricingRules.hotel_price_rules.special_destination_adjustment[destination.hotel_key]?.[
        weekdayKey
      ] ?? 0;
    const specialMonthAdjustment =
      pricingRules.seasonality_rules.special_month_adjustment[destination.hotel_key]?.[
        getMonthKey(nightDate)
      ] ?? 0;
    const noise = seededInteger(
      `${destination.hotel_key}-${trip.departDate}-${trip.returnDate}-hotel-${nightOffset}`,
      pricingRules.hotel_price_rules.random_noise_range.min,
      pricingRules.hotel_price_rules.random_noise_range.max,
    );

    let nightlyPrice =
      hotelRule.base_nightly +
      (pricingRules.hotel_price_rules.weekday_adjustment[weekdayKey] ?? 0) +
      specialDestinationAdjustment +
      pricingRules.seasonality_rules.hotel_adjustment[seasonBucket] +
      specialMonthAdjustment +
      lengthAdjustment +
      noise;

    if (pricingRules.price_clamp_rules.hotel_must_clamp_to_typical_range) {
      nightlyPrice = clamp(nightlyPrice, hotelRule.typical_min, hotelRule.typical_max);
    }

    hotelTotalPrice += Math.round(nightlyPrice);
  }

  return {
    id: `${destination.hotel_key}-${trip.departDate}-${trip.returnDate}-hotel`,
    destination: displayDestination,
    hotelName: getHotelName(destination),
    hotelNights,
    hotelAvgPricePerNight: Math.round(hotelTotalPrice / hotelNights),
    hotelTotalPrice: Math.round(hotelTotalPrice),
  };
}

function isRedEyeFlight(outboundDeparture: Date, outboundArrival: Date, returnDeparture: Date): boolean {
  const outboundDepartureMinutes =
    outboundDeparture.getHours() * 60 + outboundDeparture.getMinutes();
  const outboundArrivalMinutes = outboundArrival.getHours() * 60 + outboundArrival.getMinutes();
  const returnDepartureMinutes = returnDeparture.getHours() * 60 + returnDeparture.getMinutes();

  return (
    outboundDepartureMinutes < 7 * 60 ||
    outboundArrivalMinutes > 22 * 60 ||
    returnDepartureMinutes < 8 * 60
  );
}

function formatFlightLabel(
  outboundTemplate: FlightTimeTemplateRule,
  returnTemplate: ReturnTimeTemplateRule,
): string {
  return `${outboundTemplate.type.replaceAll("_", " ")} / ${returnTemplate.type.replaceAll("_", " ")}`;
}

function getFlightOption(
  origin: CityMeta,
  trip: CandidateTrip,
  destination: SupportedDestinationRule,
  displayDestination: string,
  route: RoutePricingRule,
  outboundTemplate: FlightTimeTemplateRule,
  returnTemplate: ReturnTimeTemplateRule,
): FlightOption {
  const outboundDeparture = buildLocalDateTime(trip.departDate, outboundTemplate.depart_time);
  const durationMinutes = getFlightDurationMinutes(outboundTemplate);
  const outboundArrival = addMinutes(outboundDeparture, durationMinutes);
  const returnDeparture = buildLocalDateTime(trip.returnDate, returnTemplate.depart_time);
  const returnArrival = getReturnArrival(trip, returnTemplate, durationMinutes);
  const isRedEye = isRedEyeFlight(outboundDeparture, outboundArrival, returnDeparture);

  return {
    id: `${origin.code}-${destination.city_code}-${trip.departDate}-${trip.returnDate}-${outboundTemplate.template_id}-${returnTemplate.template_id}`,
    originCity: origin.name,
    destination: displayDestination,
    label: formatFlightLabel(outboundTemplate, returnTemplate),
    outboundDeparture: formatLocalDateTime(outboundDeparture),
    outboundArrival: formatLocalDateTime(outboundArrival),
    returnDeparture: formatLocalDateTime(returnDeparture),
    returnArrival: formatLocalDateTime(returnArrival),
    flightTotalPrice: getFlightPrice(
      route,
      trip,
      outboundTemplate,
      returnTemplate,
      outboundArrival,
      isRedEye,
    ),
    stops: outboundTemplate.stops,
    layoverHours: outboundTemplate.layover_hours,
    isRedEye,
  };
}

function lookupRouteForOriginDest(
  origin: CityMeta,
  destination: CityMeta,
): { route: RoutePricingRule; departureGroup: string; returnGroup: string } {
  const routeKey = `${origin.code}-${destination.code}`;
  const curatedRoute = pricingRules.routes[routeKey] as RoutePricingRule | undefined;
  if (curatedRoute) {
    const departureGroup =
      pricingRules.template_mapping.route_to_departure_group[routeKey] ??
      curatedRoute.template_group;
    const returnGroup =
      pricingRules.template_mapping.route_to_return_group[routeKey] ?? "default_short";
    return { route: curatedRoute, departureGroup, returnGroup };
  }
  return synthesizeRoute(origin, destination);
}

export function matchTripData(
  input: SearchInput,
  candidateTrips: CandidateTrip[],
): MatchedTripOption[] {
  const origin = resolveCity(input.originCity);
  if (!origin) {
    return [];
  }

  const matchedTrips: MatchedTripOption[] = [];
  const seenKeys = new Set<string>();

  for (const trip of candidateTrips) {
    const destCity = resolveCity(trip.destination);
    if (!destCity) {
      continue;
    }
    if (destCity.code === origin.code) {
      continue;
    }

    const destinationRule = destinationRuleFromCity(origin, destCity);
    const { route, departureGroup, returnGroup } = lookupRouteForOriginDest(
      origin,
      destCity,
    );

    const outboundTemplates = pricingRules.flight_time_templates[departureGroup] ?? [];
    const returnTemplates = pricingRules.return_time_templates[returnGroup] ?? [];
    if (outboundTemplates.length === 0 || returnTemplates.length === 0) {
      continue;
    }

    const displayDestination = getDestinationDisplayName(trip.destination, destCity);
    const canonicalTrip: CandidateTrip = {
      ...trip,
      destination: displayDestination,
    };
    const hotel = getHotelOption(canonicalTrip, destinationRule, destCity, displayDestination);

    for (const outboundTemplate of outboundTemplates) {
      for (const returnTemplate of returnTemplates) {
        const key = `${origin.code}-${destCity.code}-${trip.departDate}-${trip.returnDate}-${outboundTemplate.template_id}-${returnTemplate.template_id}`;
        if (seenKeys.has(key)) {
          continue;
        }

        seenKeys.add(key);
        matchedTrips.push({
          candidateTrip: canonicalTrip,
          flight: getFlightOption(
            origin,
            canonicalTrip,
            destinationRule,
            displayDestination,
            route,
            outboundTemplate,
            returnTemplate,
          ),
          hotel,
        });
      }
    }
  }

  return matchedTrips;
}

// Re-export for any downstream code that previously imported these helpers.
export { resolveCity, CITIES };
export type { CityMeta };
