// Utility functions for timestamp normalization

// Normalize server timestamps: if missing timezone, assume UTC.
export function normalizeTimestamp(ts: string): string {
  if (!ts) return ts;
  let s = ts.trim();
  // Replace single space between date and time to ISO 'T'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T');
  // Append 'Z' only if no timezone info present
  if (!(/[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s))) s = s + 'Z';
  return s;
}

export function toLocalMs(ts: string): number {
  if (!ts) return NaN;
  let s = ts.trim();
  // Ensure ISO 'T'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T');
  // Many backends here emit UTC clock time but include local offset (e.g., "+05:30").
  // Treat ANY provided offset as if the string were UTC, to keep UI consistent.
  // Strategy: strip any trailing offset or Z, then append Z.
  s = s.replace(/([+-]\d{2}:\d{2}|Z)$/i, '');
  if (!(/[zZ]$/.test(s))) s = s + 'Z';
  const d = new Date(s);
  return d.getTime();
}
