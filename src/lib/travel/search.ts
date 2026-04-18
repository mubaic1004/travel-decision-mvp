import type { SearchInput, SearchResult } from "@/types/travel";

import { buildRankedTripOption } from "@/lib/travel/calculator";
import { generateCandidateTrips } from "@/lib/travel/candidate-generator";
import { filterRankedTripOptions } from "@/lib/travel/filters";
import { matchTripData } from "@/lib/travel/matcher";
import { rankTripOptions } from "@/lib/travel/ranker";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function searchTripOptions(input: SearchInput): Promise<SearchResult> {
  await delay(650);

  const candidateTrips = generateCandidateTrips(input);
  const matchedTrips = matchTripData(input, candidateTrips);
  const rankedTrips = matchedTrips
    .map(buildRankedTripOption)
    .filter((trip): trip is NonNullable<typeof trip> => trip !== null);
  const filteredTrips = filterRankedTripOptions(rankedTrips, input);

  return rankTripOptions(filteredTrips);
}
