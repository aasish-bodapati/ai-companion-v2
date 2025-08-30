export type ParsedWhen = { start: Date; end: Date; allDay: boolean };

// Lightweight natural-language time parsing for Quick Add (client-side)
export function parseQuickWhen(
  raw: string | undefined,
  defaultDurationMin: number
): ParsedWhen | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  // duration override: "for 30m" or "for 2h"
  let dur = defaultDurationMin;
  const durMatch = s.match(/for\s+(\d+)\s*(m|min|minutes|h|hr|hour|hours)\b/);
  if (durMatch) {
    const n = parseInt(durMatch[1], 10);
    const unit = durMatch[2][0];
    if (Number.isFinite(n) && n > 0) dur = unit === 'h' ? n * 60 : n;
  }

  // relative in: "in 30m", "in 2h"
  const inMatch = s.match(/\bin\s+(\d+)\s*(m|min|minutes|h|hr|hour|hours)\b/);
  if (inMatch) {
    const n = parseInt(inMatch[1], 10);
    const unit = inMatch[2][0];
    const start = new Date();
    const mins = unit === 'h' ? n * 60 : n;
    start.setMinutes(start.getMinutes() + mins);
    const end = new Date(start.getTime() + dur * 60 * 1000);
    return { start, end, allDay: false };
  }

  // anchor date: today/tomorrow or explicit YYYY-MM-DD
  const base = new Date();
  if (/\btomorrow\b/.test(s)) {
    base.setDate(base.getDate() + 1);
  } else if (/\btoday\b/.test(s)) {
    // no change
  }

  const isoDate = s.match(/(\d{4})-(\d{2})-(\d{2})(?:[ t](\d{1,2}):(\d{2}))?/);
  let hasTime = false;
  if (isoDate) {
    const [_, Y, M, D, HH, MM] = isoDate;
    base.setFullYear(parseInt(Y, 10));
    base.setMonth(parseInt(M, 10) - 1);
    base.setDate(parseInt(D, 10));
    if (HH && MM) {
      base.setHours(parseInt(HH, 10), parseInt(MM, 10), 0, 0);
      hasTime = true;
    } else {
      // all-day on that date
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      return { start, end, allDay: true };
    }
  }

  // time like 1pm, 1:30pm, 13:00
  if (!hasTime) {
    const ampm = s.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
    const twenty4 = s.match(/\b(\d{1,2}):(\d{2})\b/);
    if (ampm) {
      let hh = parseInt(ampm[1], 10) % 12;
      const mm = parseInt(ampm[2] || '0', 10);
      if (ampm[3] === 'pm') hh += 12;
      base.setHours(hh, mm, 0, 0);
      hasTime = true;
    } else if (twenty4) {
      const hh = parseInt(twenty4[1], 10);
      const mm = parseInt(twenty4[2], 10);
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        base.setHours(hh, mm, 0, 0);
        hasTime = true;
      }
    }
  }

  if (hasTime) {
    const start = base;
    const end = new Date(start.getTime() + dur * 60 * 1000);
    return { start, end, allDay: false };
  }

  // Fallback: if only words without recognizable time, return null so caller uses selection/now
  return null;
}
