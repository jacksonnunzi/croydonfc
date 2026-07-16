import fallback from '../data/fixtures.json';
import { fetchPlayHQ } from './playhq';

export type Fixture = {
  date: string;
  bounce?: string;
  home: string;
  away: string;
  venue?: string;
  competition?: string;
};

export type Result = {
  date: string;
  home: string;
  away: string;
  homeGoals: number;
  homeBehinds: number;
  awayGoals: number;
  awayBehinds: number;
  competition?: string;
};

export type TableRow = {
  pos: number;
  team: string;
  p: number;
  w: number;
  l: number;
  d: number;
  pf: number;
  pa: number;
  pct: number;
  pts: number;
};

export type SportCode = 'football' | 'netball';

export type TeamData = {
  label: string;
  code: SportCode;
  fixtures: Fixture[];
  results: Result[];
  table: TableRow[];
};

export type FixturesData = {
  updated: string;
  teams: TeamData[];
};

/**
 * Loads fixtures, results and ladders for all configured teams.
 *
 * Source priority:
 *   1. PlayHQ public API - used when PLAYHQ_API_KEY is set in env. See src/lib/playhq.ts.
 *   2. Local fallback JSON at src/data/fixtures.json - manually editable, always works.
 */
export async function loadFixtures(): Promise<FixturesData> {
  const live = await fetchPlayHQ();
  if (live) return live;
  return fallback as FixturesData;
}

export function totalPoints(goals: number, behinds: number): number {
  return goals * 6 + behinds;
}

/** Earliest upcoming fixture across all teams (used for the home page hero). */
export function nextFixture(data: FixturesData): { team: string; fixture: Fixture } | undefined {
  const today = new Date().toISOString().slice(0, 10);
  const candidates = data.teams.flatMap((t) =>
    t.fixtures.filter((f) => f.date >= today).map((f) => ({ team: t.label, fixture: f }))
  );
  candidates.sort((a, b) => (a.fixture.date < b.fixture.date ? -1 : 1));
  return candidates[0];
}

/** Earliest upcoming fixture for each team. */
export function nextFixturesByTeam(data: FixturesData): { team: string; fixture: Fixture }[] {
  const today = new Date().toISOString().slice(0, 10);
  return data.teams
    .map((t) => {
      const next = t.fixtures
        .filter((f) => f.date >= today)
        .sort((a, b) => (a.date < b.date ? -1 : 1))[0];
      return next ? { team: t.label, fixture: next } : undefined;
    })
    .filter((x): x is { team: string; fixture: Fixture } => !!x);
}

/** Most recent result across all teams. */
export function latestResult(data: FixturesData): { team: string; result: Result } | undefined {
  const candidates = data.teams.flatMap((t) =>
    t.results.map((r) => ({ team: t.label, result: r }))
  );
  candidates.sort((a, b) => (a.result.date < b.result.date ? 1 : -1));
  return candidates[0];
}
