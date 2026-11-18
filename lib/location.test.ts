import { describe, expect, it } from 'vitest';
import { parseApproximateCoordinatePair, roundToApproximate } from './location';

describe('approximate service-area coordinates', () => {
  it('rounds coordinates to a coarse, two-decimal area center', () => {
    expect(roundToApproximate(-1.0956, -90, 90)).toBe(-1.1);
    expect(roundToApproximate(37.7752, -180, 180)).toBe(37.78);
  });

  it('requires a complete valid coordinate pair and allows clearing it', () => {
    expect(parseApproximateCoordinatePair('', '')).toEqual({ coordinates: null });
    expect(parseApproximateCoordinatePair('-1.0956', '37.7752')).toEqual({
      coordinates: { latitude: -1.1, longitude: 37.78 },
    });
    expect(parseApproximateCoordinatePair('-1', '')).toMatchObject({ error: expect.any(String) });
    expect(parseApproximateCoordinatePair('91', '37')).toMatchObject({ error: expect.any(String) });
  });
});
