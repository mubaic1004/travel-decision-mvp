export interface SearchFilters {
  noRedEye: boolean;
  maxLayoverHours: number;
  latestArrivalTime: string;
  earliestReturnTime: string;
}

export interface SearchInput {
  originCity: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  maxLeaveDays: number;
  tripLengthMin: number;
  tripLengthMax: number;
  destinations: string[];
  filters: SearchFilters;
}

export interface CandidateTrip {
  destination: string;
  departDate: string;
  returnDate: string;
  leaveDates: string[];
  totalTripDays: number;
  leaveDaysUsed: number;
}

export interface FlightOption {
  id: string;
  originCity: string;
  destination: string;
  label: string;
  outboundDeparture: string;
  outboundArrival: string;
  returnDeparture: string;
  returnArrival: string;
  flightTotalPrice: number | null;
  stops: number;
  layoverHours: number;
  isRedEye: boolean;
}

export interface HotelOption {
  id: string;
  destination: string;
  hotelName: string;
  hotelNights: number;
  hotelAvgPricePerNight: number | null;
  hotelTotalPrice: number | null;
}

export interface MatchedTripOption {
  candidateTrip: CandidateTrip;
  flight: FlightOption | null;
  hotel: HotelOption | null;
}

export interface RankedTripOption extends CandidateTrip {
  id: string;
  flight: FlightOption;
  hotel: HotelOption;
  totalPrice: number;
  effectivePlayHours: number;
  pricePerEffectiveHour: number;
  experiencePenaltyScore: number;
  pricePerEffectiveHourWithPenalty: number;
  flightSummary: string;
  hotelSummary: string;
}

export interface SearchResult {
  cheapestOption: RankedTripOption | null;
  leastLeaveOption: RankedTripOption | null;
  bestValueOption: RankedTripOption | null;
  evaluatedOptions: RankedTripOption[];
}

export interface FlightTemplate {
  destination: string;
  variant: string;
  outboundDepartureTime: string;
  outboundArrivalTime: string;
  returnDepartureTime: string;
  returnArrivalTime: string;
  flightTotalPrice: number | null;
  stops: number;
  layoverHours: number;
  isRedEye: boolean;
}

export interface HotelTemplate {
  destination: string;
  hotelName: string;
  hotelAvgPricePerNight: number | null;
}

export interface PricingBaseOrigin {
  city_code: string;
  city_name: string;
  airports: string[];
}

export interface PricingDisplayCopy {
  price_label: string;
  flight_price_label: string;
  hotel_price_label: string;
  total_price_label: string;
  disclaimer: string;
}

export interface SupportedDestinationRule {
  city_code: string;
  city_name: string;
  country_code: string;
  country_name: string;
  region_type: "domestic" | "international";
  route_key: string;
  hotel_key: string;
}

export interface RoutePricingRule {
  origin: string;
  destination: string;
  region_type: "domestic" | "international";
  flight_base_price: number;
  flight_typical_min: number;
  flight_typical_max: number;
  flight_duration_hours: number;
  nonstop_ratio: number;
  template_group: string;
}

export interface HotelPricingRule {
  base_nightly: number;
  typical_min: number;
  typical_max: number;
}

export interface PricingRangeAdjustment {
  min_days_before?: number;
  max_days_before?: number;
  nights?: number;
  adjustment: number;
}

export interface RandomNoiseRange {
  min: number;
  max: number;
}

export interface FlightPriceRules {
  departure_weekday_adjustment: Record<string, number>;
  return_weekday_adjustment: Record<string, number>;
  booking_window_adjustment: PricingRangeAdjustment[];
  quality_adjustment: Record<string, number>;
  region_multiplier: Record<string, number>;
  random_noise_range: RandomNoiseRange;
}

export interface HotelPriceRules {
  weekday_adjustment: Record<string, number>;
  length_of_stay_adjustment_per_night: PricingRangeAdjustment[];
  special_destination_adjustment: Record<string, Record<string, number>>;
  random_noise_range: RandomNoiseRange;
}

export interface SeasonalityAdjustments {
  major_holiday_window: number;
  summer_peak: number;
  winter_peak: number;
  shoulder_season: number;
  low_season: number;
}

export interface SeasonalityRules {
  domestic: SeasonalityAdjustments;
  international: SeasonalityAdjustments;
  hotel_adjustment: SeasonalityAdjustments;
  special_month_adjustment: Record<string, Record<string, number>>;
}

export interface HolidayRules {
  china_public_holiday_keywords: string[];
  holiday_window_days: number;
  pre_holiday_departure_surcharge: number;
  last_day_return_surcharge: number;
}

export interface FlightTimeTemplateRule {
  template_id: string;
  type: string;
  depart_time: string;
  arrival_time_offset_hours: number;
  stops: number;
  layover_hours: number;
}

export interface ReturnTimeTemplateRule {
  template_id: string;
  type: string;
  depart_time: string;
}

export interface TemplateMappingRules {
  route_to_departure_group: Record<string, string>;
  route_to_return_group: Record<string, string>;
}

export interface EffectiveTimeRules {
  play_window_start: string;
  play_window_end: string;
  full_day_play_hours: number;
  latest_arrival_time_default: string;
  earliest_return_departure_default: string;
  min_effective_play_hours: number;
}

export interface FilterDefaults {
  no_red_eye: boolean;
  max_layover_hours: number;
  latest_arrival_time: string;
  earliest_return_time: string;
  prefer_nonstop: boolean;
}

export interface ExperiencePenaltyRules {
  arrival_after_21_00: number;
  arrival_after_20_00: number;
  return_before_09_00: number;
  return_before_10_00: number;
  one_stop: number;
  two_stops: number;
  layover_over_2h: number;
  layover_over_3h: number;
}

export interface PriceClampRules {
  flight_must_clamp_to_typical_range: boolean;
  hotel_must_clamp_to_typical_range: boolean;
}

export interface SeedRules {
  seed_key_format: string;
  use_seeded_random: boolean;
}

export interface PricingRulesData {
  version: string;
  currency: string;
  base_origin: PricingBaseOrigin;
  display_copy: PricingDisplayCopy;
  supported_destinations: SupportedDestinationRule[];
  routes: Record<string, RoutePricingRule>;
  hotels: Record<string, HotelPricingRule>;
  flight_price_rules: FlightPriceRules;
  hotel_price_rules: HotelPriceRules;
  seasonality_rules: SeasonalityRules;
  holiday_rules: HolidayRules;
  flight_time_templates: Record<string, FlightTimeTemplateRule[]>;
  return_time_templates: Record<string, ReturnTimeTemplateRule[]>;
  template_mapping: TemplateMappingRules;
  effective_time_rules: EffectiveTimeRules;
  filter_defaults: FilterDefaults;
  experience_penalty_rules: ExperiencePenaltyRules;
  price_clamp_rules: PriceClampRules;
  sorting_targets: Record<string, Record<string, string>>;
  seed_rules: SeedRules;
  implementation_notes: Record<string, string>;
}

export interface SearchFormValues {
  originCity: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  maxLeaveDays: string;
  tripLengthMin: string;
  tripLengthMax: string;
  destinations: string;
  noRedEye: boolean;
  maxLayoverHours: string;
  latestArrivalTime: string;
  earliestReturnTime: string;
}
