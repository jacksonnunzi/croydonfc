# PlayHQ API key request

Once sent and the key arrives, set these in Netlify env vars (never commit):

- `PLAYHQ_API_KEY` — the key PlayHQ sends back
- `PLAYHQ_ORG_ID` — `1dda6c4e` (from the public PlayHQ URL)
- `PLAYHQ_TENANT` — `afl`

The integration code is already in `src/lib/playhq.ts`; `loadFixtures()` will
automatically switch from the `src/data/fixtures.json` fallback to the live API
the moment those vars are present. No code changes required.

---

## Draft email

**To:** support@playhq.com (or via https://support.playhq.com/hc/en-au/requests/new)
**Subject:** API key request — Croydon Football Netball Club website

Hi PlayHQ team,

I maintain the official website for Croydon Football Netball Club (EFNL, Div 2).
We'd like to display our fixtures, results and ladders on our own site rather
than linking out to PlayHQ each week.

I understand from your support docs and the "Fixture Viewer for PlayHQ"
WordPress plugin that you issue API keys to clubs for this purpose. Could I
please request an `x-api-key` for our organisation?

- **Organisation:** Croydon Football Netball Club
- **PlayHQ org ID:** `1dda6c4e` (from https://www.playhq.com/afl/org/croydon-eastern-football-netball-league/1dda6c4e)
- **Tenant:** `afl`
- **Usage:** read-only, server-side fetch during site build (~4 times per day)
  to populate fixtures / results / ladder on croydonfc.com.au
- **Endpoints we'd call:** `/v1/organisations/{id}/seasons`, `/v1/seasons/{id}/grades`, `/v1/grades/{id}/fixture`, `/v1/grades/{id}/ladder`

Happy to sign any usage terms you need and abide by your rate limits.

Thanks,
[your name]
Croydon Football Netball Club
