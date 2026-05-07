import type { SearchFormValues } from "@/types/travel";

export const DEFAULT_SEARCH_FORM_VALUES: SearchFormValues = {
  originCity: "Shanghai",
  dateRangeStart: "2026-01-01",
  dateRangeEnd: "2026-01-30",
  maxLeaveDays: "2",
  tripLengthMin: "3",
  tripLengthMax: "5",
  destinations: "Beijing",
  noRedEye: true,
  maxLayoverHours: "4",
  latestArrivalTime: "18:30",
  earliestReturnTime: "11:00",
};
