import { describe, expect, it } from 'vitest';
import { isLaunchGateEnabled } from './launch-gate';

describe('launch gate', () => {
  it('is on when no environment value is configured', () => {
    expect(isLaunchGateEnabled(undefined)).toBe(true);
  });

  it('stays on for values other than an explicit false', () => {
    expect(isLaunchGateEnabled('')).toBe(true);
    expect(isLaunchGateEnabled('true')).toBe(true);
    expect(isLaunchGateEnabled('0')).toBe(true);
  });

  it('opens only for an explicit false value', () => {
    expect(isLaunchGateEnabled('false')).toBe(false);
    expect(isLaunchGateEnabled(' FALSE ')).toBe(false);
  });
});
