/**
 * Fail closed before launch. Only an explicit owner-controlled environment
 * value of `false` opens the launch gate after the required legal review.
 */
export function isLaunchGateEnabled(value = process.env.LAUNCH_GATE): boolean {
  return value?.trim().toLowerCase() !== 'false';
}
