/** Baked place list for search. Coordinates are approximate, rounded to one
 *  decimal and typed in by hand (ledger row "gazetteer", status unverified).
 *  They only decide which scope tier a place falls in. */
export interface Place { name: string; region: string; lat: number; lon: number }

export const GAZETTEER: Place[] = [
  { name: "Overberg", region: "Western Cape, South Africa", lat: -34.2, lon: 19.8 },
  { name: "Swartland", region: "Western Cape, South Africa", lat: -33.5, lon: 18.7 },
  { name: "Cape Town", region: "South Africa", lat: -33.9, lon: 18.4 },
  { name: "Bloemfontein", region: "South Africa", lat: -29.1, lon: 26.2 },
  { name: "Johannesburg", region: "South Africa", lat: -26.2, lon: 28.0 },
  { name: "Durban", region: "South Africa", lat: -29.9, lon: 31.0 },
  { name: "Gqeberha", region: "South Africa", lat: -34.0, lon: 25.6 },
  { name: "Kimberley", region: "South Africa", lat: -28.7, lon: 24.8 },
  { name: "Polokwane", region: "South Africa", lat: -23.9, lon: 29.5 },
  { name: "Harare", region: "Zimbabwe", lat: -17.8, lon: 31.1 },
  { name: "Nairobi", region: "Kenya", lat: -1.3, lon: 36.8 },
  { name: "Addis Ababa", region: "Ethiopia", lat: 9.0, lon: 38.7 },
  { name: "Lagos", region: "Nigeria", lat: 6.5, lon: 3.4 },
  { name: "Cairo", region: "Egypt", lat: 30.0, lon: 31.2 },
  { name: "Perth", region: "Australia", lat: -31.9, lon: 115.9 },
  { name: "Adelaide", region: "Australia", lat: -34.9, lon: 138.6 },
  { name: "Sydney", region: "Australia", lat: -33.9, lon: 151.2 },
  { name: "Delhi", region: "India", lat: 28.6, lon: 77.2 },
  { name: "Beijing", region: "China", lat: 39.9, lon: 116.4 },
  { name: "Tokyo", region: "Japan", lat: 35.7, lon: 139.7 },
  { name: "London", region: "United Kingdom", lat: 51.5, lon: -0.1 },
  { name: "Paris", region: "France", lat: 48.9, lon: 2.4 },
  { name: "Madrid", region: "Spain", lat: 40.4, lon: -3.7 },
  { name: "Kyiv", region: "Ukraine", lat: 50.5, lon: 30.5 },
  { name: "Ankara", region: "Türkiye", lat: 39.9, lon: 32.9 },
  { name: "Winnipeg", region: "Canada", lat: 49.9, lon: -97.1 },
  { name: "Kansas City", region: "United States", lat: 39.1, lon: -94.6 },
  { name: "Mexico City", region: "Mexico", lat: 19.4, lon: -99.1 },
  { name: "São Paulo", region: "Brazil", lat: -23.6, lon: -46.6 },
  { name: "Buenos Aires", region: "Argentina", lat: -34.6, lon: -58.4 },
  { name: "Santiago", region: "Chile", lat: -33.4, lon: -70.7 },
];
