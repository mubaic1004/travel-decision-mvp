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
  addDays,
  formatDateInput,
  hashString,
  normalizeText,
  timeToMinutes,
  toLocalDate,
} from "@/lib/travel/utils";

const DESTINATION_ALIASES: Record<string, string[]> = {
  BJS: ["beijing", "北京", "PEK", "PKX"],
  CTU: ["chengdu", "成都", "TFU"],
  XIY: ["xi'an", "xian", "西安"],
  CKG: ["chongqing", "重庆"],
  CAN: ["guangzhou", "广州"],
  SZX: ["shenzhen", "深圳"],
  KMG: ["kunming", "昆明"],
  SYX: ["sanya", "三亚"],
  DYG: ["zhangjiajie", "张家界"],
  XMN: ["xiamen", "厦门"],
  HRB: ["harbin", "哈尔滨"],
  HGH: ["hangzhou", "杭州"],
  NKG: ["nanjing", "南京"],
  WUH: ["wuhan", "武汉"],
  CSX: ["changsha", "长沙"],
  TAO: ["qingdao", "青岛"],
  TSN: ["tianjin", "天津"],
  DLC: ["dalian", "大连"],
  SHE: ["shenyang", "沈阳"],
  HAK: ["haikou", "海口"],
  KWL: ["guilin", "桂林"],
  LJG: ["lijiang", "丽江"],
  LXA: ["lhasa", "拉萨"],
  URC: ["urumqi", "乌鲁木齐"],
  HKG: ["hong kong", "hongkong", "香港"],
  MFM: ["macau", "macao", "澳门"],
  TPE: ["taipei", "台北", "台湾", "taiwan", "TSA"],
  TYO: ["tokyo", "东京", "HND", "NRT"],
  OSA: ["osaka", "大阪", "KIX", "ITM"],
  FUK: ["fukuoka", "福冈"],
  SPK: ["sapporo", "札幌", "CTS"],
  OKA: ["okinawa", "冲绳", "那霸", "naha"],
  ICN: ["seoul", "首尔", "GMP"],
  PUS: ["busan", "釜山"],
  BKK: ["bangkok", "曼谷", "DMK"],
  HAN: ["hanoi", "河内"],
  SGN: ["ho chi minh", "saigon", "胡志明", "西贡"],
  CNX: ["chiang mai", "清迈"],
  HKT: ["phuket", "普吉", "普吉岛"],
  SIN: ["singapore", "新加坡"],
  KUL: ["kuala lumpur", "吉隆坡"],
  DPS: ["bali", "denpasar", "巴厘", "巴厘岛"],
  MNL: ["manila", "马尼拉"],
  MLE: ["maldives", "male", "马尔代夫", "马累"],
  DXB: ["dubai", "迪拜"],
  LHR: ["london", "伦敦", "LGW", "STN"],
  CDG: ["paris", "巴黎", "ORY"],
  LAX: ["los angeles", "洛杉矶"],
  NYC: ["new york", "纽约", "JFK", "EWR", "LGA"],
  SYD: ["sydney", "悉尼"],
};

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

const destinationLookup = new Map<string, SupportedDestinationRule>();
const supportedOriginAliases = new Set<string>(
  [
    pricingRules.base_origin.city_code,
    pricingRules.base_origin.city_name,
    ...pricingRules.base_origin.airports,
    "上海",
    "上海虹桥",
    "上海浦东",
  ].map(normalizeText),
);

for (const destination of pricingRules.supported_destinations) {
  const aliases = new Set<string>([
    destination.city_code,
    destination.city_name,
    destination.route_key,
    ...(DESTINATION_ALIASES[destination.city_code] ?? []),
  ]);

  for (const alias of aliases) {
    destinationLookup.set(normalizeText(alias), destination);
  }
}

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

function isSupportedOrigin(originCity: string): boolean {
  return supportedOriginAliases.has(normalizeText(originCity));
}

function resolveDestination(destination: string): SupportedDestinationRule | null {
  return destinationLookup.get(normalizeText(destination)) ?? null;
}

function getDestinationDisplayName(
  rawDestination: string,
  destination: SupportedDestinationRule,
): string {
  const trimmed = rawDestination.trim();
  if (!trimmed) {
    return destination.city_name;
  }

  if (normalizeText(trimmed) === normalizeText(destination.city_code)) {
    return destination.city_name;
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

function getHotelOption(
  trip: CandidateTrip,
  destination: SupportedDestinationRule,
  displayDestination: string,
): HotelOption {
  const hotelRule = pricingRules.hotels[destination.hotel_key] as HotelPricingRule;
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
  input: SearchInput,
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
    id: `${destination.route_key}-${trip.departDate}-${trip.returnDate}-${outboundTemplate.template_id}-${returnTemplate.template_id}`,
    originCity: isSupportedOrigin(input.originCity)
      ? pricingRules.base_origin.city_name
      : input.originCity,
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

export function matchTripData(
  input: SearchInput,
  candidateTrips: CandidateTrip[],
): MatchedTripOption[] {
  if (!isSupportedOrigin(input.originCity)) {
    return [];
  }

  const matchedTrips: MatchedTripOption[] = [];
  const seenKeys = new Set<string>();

  for (const trip of candidateTrips) {
    const destination = resolveDestination(trip.destination);
    if (!destination) {
      continue;
    }

    const route = pricingRules.routes[destination.route_key] as RoutePricingRule | undefined;
    if (!route) {
      continue;
    }

    const departureGroup =
      pricingRules.template_mapping.route_to_departure_group[destination.route_key] ??
      route.template_group;
    const returnGroup =
      pricingRules.template_mapping.route_to_return_group[destination.route_key] ??
      "default_short";
    const outboundTemplates = pricingRules.flight_time_templates[departureGroup] ?? [];
    const returnTemplates = pricingRules.return_time_templates[returnGroup] ?? [];
    const displayDestination = getDestinationDisplayName(trip.destination, destination);
    const canonicalTrip: CandidateTrip = {
      ...trip,
      destination: displayDestination,
    };
    const hotel = getHotelOption(canonicalTrip, destination, displayDestination);

    for (const outboundTemplate of outboundTemplates) {
      for (const returnTemplate of returnTemplates) {
        const key = `${destination.route_key}-${trip.departDate}-${trip.returnDate}-${outboundTemplate.template_id}-${returnTemplate.template_id}`;
        if (seenKeys.has(key)) {
          continue;
        }

        seenKeys.add(key);
        matchedTrips.push({
          candidateTrip: canonicalTrip,
          flight: getFlightOption(
            input,
            canonicalTrip,
            destination,
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
