export type ApproximateCoordinates = { latitude: number; longitude: number };

export function roundToApproximate(value: number, minimum: number, maximum: number): number | null {
  if (!Number.isFinite(value) || value < minimum || value > maximum) return null;
  return Math.sign(value) * Math.round(Math.abs(value) * 100) / 100;
}

export function parseApproximateCoordinatePair(latitude: unknown, longitude: unknown): {
  coordinates: ApproximateCoordinates | null;
  error?: string;
} {
  const latitudeText = String(latitude ?? '').trim();
  const longitudeText = String(longitude ?? '').trim();
  if (!latitudeText && !longitudeText) return { coordinates: null };
  if (!latitudeText || !longitudeText) return { coordinates: null, error: 'Enter both approximate coordinates or leave both empty.' };

  const rawLatitude = Number(latitudeText);
  const rawLongitude = Number(longitudeText);
  const roundedLatitude = roundToApproximate(rawLatitude, -90, 90);
  const roundedLongitude = roundToApproximate(rawLongitude, -180, 180);
  if (roundedLatitude === null || roundedLongitude === null) {
    return { coordinates: null, error: 'Enter valid latitude and longitude values.' };
  }
  return { coordinates: { latitude: roundedLatitude, longitude: roundedLongitude } };
}
