// Lightweight runtime feature-flag helper with env fallback.
// Note: Runtime flags are process-local and non-persistent.

const runtimeFlags: Record<string, boolean> = {};

export function setRuntimeFlag(key: string, value: boolean): void {
  runtimeFlags[key] = value;
}

export function getRuntimeFlag(key: string, envFallback?: boolean): boolean {
  if (Object.prototype.hasOwnProperty.call(runtimeFlags, key)) {
    return runtimeFlags[key];
  }
  return envFallback ?? false;
}

export const FLAG_POLAR_DOWNGRADE_ON_CANCEL = 'POLAR_DOWNGRADE_ON_CANCEL';

