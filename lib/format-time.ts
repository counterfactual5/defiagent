/** Relative / absolute time helpers for tool freshness. */

export function formatFetchedAt(ts?: number | null, now = Date.now()): string | null {
  if (ts == null || !Number.isFinite(ts)) return null;
  const delta = Math.max(0, now - ts);
  if (delta < 5_000) return 'just now';
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

export function formatIso(ts?: number | null): string | null {
  if (ts == null || !Number.isFinite(ts)) return null;
  try {
    return new Date(ts).toISOString();
  } catch {
    return null;
  }
}
