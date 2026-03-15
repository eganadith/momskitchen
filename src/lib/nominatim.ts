/**
 * Nominatim (OpenStreetMap) – free, no API key.
 * Search: https://nominatim.openstreetmap.org/search?q=...&format=json
 * Reverse: https://nominatim.openstreetmap.org/reverse?lat=...&lon=...&format=json
 * Use max 1 request per second (debounce on client).
 */

const BASE = "https://nominatim.openstreetmap.org";
const HEADERS: HeadersInit = {
  "Accept-Language": "en",
  "User-Agent": "MamasKitchen/1.0 (campus food delivery)",
};

export interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface NominatimReverseResult {
  display_name?: string;
}

/** Search for a place or address. */
export async function nominatimSearch(
  query: string,
  limit = 5
): Promise<NominatimSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `${BASE}/search?q=${encodeURIComponent(q)}&format=json&limit=${limit}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  return res.json();
}

/** Reverse geocode: lat/lon → address. */
export async function nominatimReverse(
  lat: number,
  lon: number
): Promise<string> {
  const url = `${BASE}/reverse?lat=${lat}&lon=${lon}&format=json`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  const data = (await res.json()) as NominatimReverseResult;
  return data.display_name ?? `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
