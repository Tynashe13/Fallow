/** Solar geometry — plain astronomy, computed, never measured. */

const RAD = Math.PI / 180;

/** Solar declination (degrees) for a day of year, Cooper's equation. */
export function declination(dayOfYear: number): number {
  return 23.45 * Math.sin(RAD * ((360 / 365) * (dayOfYear + 284)));
}

/** Noon solar altitude above the horizon (degrees) at a latitude for a
 *  given declination. Positive latitudes north, declination north. */
export function noonAltitude(lat: number, decl: number): number {
  return 90 - Math.abs(lat - decl);
}

/** For southern-hemisphere winter plates: 21 June (day 172). */
export const JUNE_SOLSTICE_DOY = 172;

export function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86400_000);
}

/** Current sun position (altitude + azimuth, degrees) — NOAA
 *  approximation, good to a fraction of a degree, plenty for a sky. */
export function sunPosition(date: Date, lat: number, lon: number) {
  const doy = dayOfYear(date);
  const decl = declination(doy);
  const minutesUTC =
    date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;

  // Equation of time (minutes)
  const b = RAD * ((360 / 365) * (doy - 81));
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

  const solarMinutes = minutesUTC + 4 * lon + eot; // solar time, minutes
  const hourAngle = (solarMinutes / 4 - 180) * RAD; // 0 at solar noon

  const latR = lat * RAD;
  const declR = decl * RAD;

  const sinAlt =
    Math.sin(latR) * Math.sin(declR) +
    Math.cos(latR) * Math.cos(declR) * Math.cos(hourAngle);
  const alt = Math.asin(sinAlt);

  const cosAz =
    (Math.sin(declR) - Math.sin(alt) * Math.sin(latR)) /
    (Math.cos(alt) * Math.cos(latR));
  let az = Math.acos(Math.min(1, Math.max(-1, cosAz)));
  if (hourAngle > 0) az = 2 * Math.PI - az; // afternoon → west side

  return { altitudeDeg: alt / RAD, azimuthDeg: az / RAD, declinationDeg: decl };
}
