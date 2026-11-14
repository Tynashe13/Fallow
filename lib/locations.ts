export interface FieldLocation {
  slug: string;
  name: string;
  region: string;
  plate: number;
  lat: number;
  lon: number;
  /** half-size of the terrain block, degrees */
  halfDeg: number;
  /** soil palette on the cut faces: [light surface, dark deep] */
  soilLight: string;
  soilDark: string;
  blurb: string;
}

export const LOCATIONS: FieldLocation[] = [
  {
    slug: "overberg",
    name: "Overberg, Western Cape",
    region: "Rûens wheat belt · South Africa",
    plate: 1,
    lat: -34.2,
    lon: 19.9,
    halfDeg: 0.055,
    soilLight: "#b3938f",
    soilDark: "#6b4a4e",
    blurb:
      "Rolling shale hills between the Hottentots-Holland mountains and the Agulhas coast. Winter wheat, barley, canola and sheep.",
  },
  {
    slug: "swartland",
    name: "Swartland, Western Cape",
    region: "Malmesbury plain · South Africa",
    plate: 2,
    lat: -33.46,
    lon: 18.73,
    halfDeg: 0.055,
    soilLight: "#cdbb98",
    soilDark: "#82684a",
    blurb:
      "Sandy granite-derived soils north of Cape Town. One of South Africa's oldest grain districts — wheat, lupins and vines.",
  },
];

export function getLocation(slug: string): FieldLocation | undefined {
  return LOCATIONS.find((l) => l.slug === slug);
}

export const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

export const DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const SOIL_DEPTHS = [
  "0-5cm", "5-15cm", "15-30cm", "30-60cm", "60-100cm", "100-200cm",
] as const;
