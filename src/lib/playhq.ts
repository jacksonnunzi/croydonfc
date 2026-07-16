/**
 * PlayHQ public API integration.
 *
 * Activated at build time when PLAYHQ_API_KEY is set in the environment.
 * Without the key, this module exports a no-op that returns null so the
 * caller falls back to the local JSON in src/data/fixtures.json.
 *
 * Required env vars (set in Netlify build settings, never commit):
 *   PLAYHQ_API_KEY      - UUID supplied by PlayHQ via the EFNL admin
 *   PLAYHQ_ORG_ID       - 32-char UUID for Croydon FNC's PlayHQ organisation
 *
 * Optional env vars:
 *   PLAYHQ_TENANT       - sport tenant code, defaults to "afl"
 *   PLAYHQ_SEASON_ID    - lock to a specific season; otherwise the most
 *                         recent season returned by /seasons is used
 *   PLAYHQ_TEAMS        - JSON array of teams to surface, e.g.
 *                         '[{"label":"Seniors","gradeName":"Premier Division Seniors"},
 *                           {"label":"Reserves","gradeName":"Premier Division Reserves"},
 *                           {"label":"Under 19.5","gradeName":"Under 19.5"}]'
 *                         If unset, the fetcher tries to auto-match by name.
 *
 * Notes:
 *   - All endpoints under /v1/ require the x-api-key + x-phq-tenant headers.
 *   - Pagination: when metadata.hasMore === true, follow ?cursor=metadata.nextCursor.
 *   - Field shapes below are best-effort based on PlayHQ docs and may need
 *     adjusting once we see a real response. Anything we can't map cleanly is
 *     dropped with a console.warn rather than crashing the build.
 */

import type { FixturesData, TeamData, Fixture, Result, TableRow } from './fixtures';

const BASE = 'https://api.playhq.com/v1';
const CROYDON_ALIASES = ['croydon', 'croydon fc', 'croydon football club', 'croydon blues'];

type TeamConfig = { label: string; gradeName?: string; gradeId?: string };

const DEFAULT_TEAMS: TeamConfig[] = [
  { label: 'Seniors', gradeName: 'Seniors' },
  { label: 'Reserves', gradeName: 'Reserves' },
  { label: 'Under 19.5', gradeName: 'Under 19.5' },
];

function env(name: string): string | undefined {
  const v = (import.meta.env as Record<string, string | undefined>)[name];
  return v && v.length > 0 ? v : undefined;
}

function headers(apiKey: string, tenant: string): HeadersInit {
  return {
    'x-api-key': apiKey,
    'x-phq-tenant': tenant,
    accept: 'application/json',
  };
}

async function getAll<T>(url: string, init: RequestInit): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 50; i++) {
    const u = cursor ? `${url}${url.includes('?') ? '&' : '?'}cursor=${encodeURIComponent(cursor)}` : url;
    const res = await fetch(u, init);
    if (!res.ok) {
      throw new Error(`PlayHQ ${res.status} ${res.statusText} for ${u}`);
    }
    const body = (await res.json()) as { data: T[]; metadata?: { hasMore?: boolean; nextCursor?: string } };
    if (Array.isArray(body.data)) out.push(...body.data);
    if (!body.metadata?.hasMore || !body.metadata.nextCursor) break;
    cursor = body.metadata.nextCursor;
  }
  return out;
}

function isCroydon(name: string | undefined): boolean {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return CROYDON_ALIASES.some((a) => n === a || n.startsWith('croydon'));
}

// --- response → internal shape mappers (best-effort, adjust once we see live data) ---

function mapFixture(g: any, competition?: string): Fixture {
  const date: string = (g.startDate ?? g.date ?? '').slice(0, 10);
  const bounce: string | undefined = g.startTime ?? (g.startDate ? String(g.startDate).slice(11, 16) : undefined);
  return {
    date,
    bounce,
    home: g.homeTeam?.name ?? g.home?.name ?? 'TBC',
    away: g.awayTeam?.name ?? g.away?.name ?? 'TBC',
    venue: g.venue?.name ?? g.venueName,
    competition,
  };
}

function mapResult(g: any, competition?: string): Result | null {
  const homeGoals = g.homeTeam?.score?.goals ?? g.score?.home?.goals;
  const homeBehinds = g.homeTeam?.score?.behinds ?? g.score?.home?.behinds;
  const awayGoals = g.awayTeam?.score?.goals ?? g.score?.away?.goals;
  const awayBehinds = g.awayTeam?.score?.behinds ?? g.score?.away?.behinds;
  if ([homeGoals, homeBehinds, awayGoals, awayBehinds].some((n) => typeof n !== 'number')) return null;
  return {
    date: (g.startDate ?? g.date ?? '').slice(0, 10),
    home: g.homeTeam?.name ?? 'TBC',
    away: g.awayTeam?.name ?? 'TBC',
    homeGoals,
    homeBehinds,
    awayGoals,
    awayBehinds,
    competition,
  };
}

function mapLadderRow(row: any, idx: number): TableRow {
  return {
    pos: row.position ?? row.rank ?? idx + 1,
    team: row.team?.name ?? row.name ?? 'Unknown',
    p: row.played ?? row.matchesPlayed ?? 0,
    w: row.wins ?? 0,
    l: row.losses ?? 0,
    d: row.draws ?? 0,
    pf: row.pointsFor ?? row.for ?? 0,
    pa: row.pointsAgainst ?? row.against ?? 0,
    pct: row.percentage ?? row.pct ?? 0,
    pts: row.points ?? row.competitionPoints ?? 0,
  };
}

// --- main entry point ---

export async function fetchPlayHQ(): Promise<FixturesData | null> {
  const apiKey = env('PLAYHQ_API_KEY');
  const orgId = env('PLAYHQ_ORG_ID');
  if (!apiKey || !orgId) return null;

  const tenant = env('PLAYHQ_TENANT') ?? 'afl';
  const init: RequestInit = { headers: headers(apiKey, tenant) };

  let teamsConfig: TeamConfig[] = DEFAULT_TEAMS;
  const cfgRaw = env('PLAYHQ_TEAMS');
  if (cfgRaw) {
    try {
      teamsConfig = JSON.parse(cfgRaw);
    } catch (e) {
      console.warn('[playhq] invalid PLAYHQ_TEAMS env, using defaults:', e);
    }
  }

  try {
    // 1. Find season
    let seasonId = env('PLAYHQ_SEASON_ID');
    if (!seasonId) {
      const seasons = await getAll<any>(`${BASE}/organisations/${orgId}/seasons`, init);
      // Pick the season whose end date is in the future, or the most recent.
      const today = new Date().toISOString().slice(0, 10);
      const current =
        seasons.find((s) => (s.endDate ?? '9999') >= today) ??
        [...seasons].sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0];
      seasonId = current?.id;
    }
    if (!seasonId) {
      console.warn('[playhq] no season found for org', orgId);
      return null;
    }

    // 2. Grades for that season
    const grades = await getAll<any>(`${BASE}/seasons/${seasonId}/grades`, init);

    // 3. For each configured team, find its grade and fetch fixtures + ladder
    const teams: TeamData[] = [];
    for (const cfg of teamsConfig) {
      const grade = cfg.gradeId
        ? grades.find((g) => g.id === cfg.gradeId)
        : grades.find((g) => g.name?.toLowerCase().includes((cfg.gradeName ?? cfg.label).toLowerCase()));
      if (!grade) {
        console.warn(`[playhq] no grade matched for "${cfg.label}"`);
        teams.push({ label: cfg.label, code: 'football', fixtures: [], results: [], table: [] });
        continue;
      }

      const [games, ladder] = await Promise.all([
        getAll<any>(`${BASE}/grades/${grade.id}/fixture`, init).catch((e) => {
          console.warn(`[playhq] fixture fetch failed for ${cfg.label}:`, e);
          return [] as any[];
        }),
        getAll<any>(`${BASE}/grades/${grade.id}/ladder`, init).catch((e) => {
          console.warn(`[playhq] ladder fetch failed for ${cfg.label}:`, e);
          return [] as any[];
        }),
      ]);

      // Filter to games involving Croydon
      const croydonGames = games.filter(
        (g) => isCroydon(g.homeTeam?.name ?? g.home?.name) || isCroydon(g.awayTeam?.name ?? g.away?.name)
      );

      const today = new Date().toISOString().slice(0, 10);
      const fixtures: Fixture[] = [];
      const results: Result[] = [];
      for (const g of croydonGames) {
        const date = (g.startDate ?? g.date ?? '').slice(0, 10);
        const r = mapResult(g, grade.name);
        if (r && date < today) {
          results.push(r);
        } else {
          fixtures.push(mapFixture(g, grade.name));
        }
      }
      fixtures.sort((a, b) => (a.date < b.date ? -1 : 1));
      results.sort((a, b) => (a.date < b.date ? 1 : -1));

      const table: TableRow[] = ladder.map(mapLadderRow);

      teams.push({ label: cfg.label, code: 'football', fixtures, results, table });
    }

    return {
      updated: new Date().toISOString().slice(0, 10),
      teams,
    };
  } catch (err) {
    console.warn('[playhq] fetch failed, falling back to local JSON:', err);
    return null;
  }
}
