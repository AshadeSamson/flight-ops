import fetchFidsData from "./fetchFidsData";
import normalizeFidsData from "./normalizeFidsData";

export default async function getNormalizedFidsData() {
  const { departures, arrivals } = await fetchFidsData();

  const normalized = normalizeFidsData(departures, arrivals);

  return normalized;
}