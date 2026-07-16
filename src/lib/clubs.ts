/**
 * Logos for opposition clubs in our division (and ourselves).
 * Returns null when we don't have a logo - callers fall back to initials.
 */
export function logoFor(team: string): string | null {
  if (/croydon/i.test(team)) return '/images/logos/croydon.png';
  if (/lilydale/i.test(team)) return '/images/logos/lilydale.png';
  if (/heathmont/i.test(team)) return '/images/logos/heathmont.jpg';
  if (/east\s*burwood/i.test(team)) return '/images/logos/east-burwood.png';
  if (/templestowe/i.test(team)) return '/images/logos/templestowe.png';
  if (/ringwood/i.test(team)) return '/images/logos/ringwood.png';
  if (/waverley/i.test(team)) return '/images/logos/waverley-blues.jpg';
  if (/scoresby/i.test(team)) return '/images/logos/scoresby.png';
  if (/mulgrave/i.test(team)) return '/images/logos/mulgrave.png';
  if (/surrey\s*park/i.test(team)) return '/images/logos/surrey-park.webp';
  return null;
}

/** Fallback initials when no logo is available. Strips "Seniors/Reserves/U19.5" suffixes. */
export function initialsFor(team: string): string {
  return team
    .replace(/\b(seniors?|reserves?|u\d+(?:\.\d+)?)\b/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

/** Parse the round number out of a competition string like "Div 2 - U19.5 · Round 3 (ANZAC)". */
export function roundOf(competition?: string): number | null {
  if (!competition) return null;
  const m = competition.match(/Round\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}
