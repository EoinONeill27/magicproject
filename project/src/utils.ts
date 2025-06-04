export function deepClone<T>(obj: T): T {
  // Convert Sets to Arrays before stringifying
  const stringified = JSON.stringify(obj, (key, value) => {
    if (value instanceof Set) {
      return Array.from(value);
    }
    return value;
  });

  // Convert Arrays back to Sets after parsing
  return JSON.parse(stringified, (key, value) => {
    if (key === 'eliminations' && Array.isArray(value)) {
      return new Set(value);
    }
    return value;
  });
}

export function calculateTotalTurnTime(times: number[]): number {
  if (times.length === 0) return 0;
  return times.reduce((a, b) => a + b, 0);
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 