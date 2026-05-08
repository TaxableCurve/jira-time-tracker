@AGENTS.md

# Jira Time Tracker

Electron + Next.js app for logging time to Jira with a live timer, interactive calendar, and reports.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS** + **shadcn/ui** + **@base-ui/react**
- **FullCalendar** (`@fullcalendar/react`) for the calendar view
- **TanStack Query** for server state
- **Zustand** for global timer state
- **Recharts** for reports
- **Electron** for the desktop app wrapper

## Key conventions

- Next.js API Routes act as a proxy to Jira API — the Jira token never reaches the browser.
- Jira auth uses Basic auth: `base64("email:api_token")`. Credentials are stored via Electron `safeStorage`.
- Jira API v3 uses `accountId` (not username). Fetch it from `/rest/api/3/myself` on startup.
- Time in Jira is always in **seconds**. Use helpers in `lib/format.ts` to convert to/from human-readable.
- Minimum worklog duration accepted by Jira: **60 seconds**.
- `DELETE /rest/api/3/issue/{id}/worklog/{id}` returns 204 No Content — handle empty body.

## Dev commands

```bash
pnpm dev                  # Next.js only
pnpm electron:dev         # Electron + Next.js together
pnpm build                # Production Next.js build
pnpm electron:build       # Full Electron distributable
pnpm lint                 # ESLint
pnpm release:patch        # Bump patch version + push + push tags
pnpm release:minor        # Bump minor version + push + push tags
pnpm release:major        # Bump major version + push + push tags
```

## Project structure

```
app/
  (app)/calendar/     # Main calendar view
  (app)/reports/      # Reports view
  api/jira/           # Proxy routes to Jira REST API
  setup/              # Initial credentials setup screen
components/
  calendar/           # FullCalendar wrappers and worklog blocks
  timer/              # Global timer bar and controls
  issue-panel/        # Sidebar issue list
  reports/            # Charts and summary cards
lib/
  jira.ts             # Server-side Jira API client
  format.ts           # Time conversion helpers
store/
  timer.ts            # Zustand timer state
electron/             # Electron main process
```

## Package manager

This project uses **pnpm**. Always use `pnpm` — never `npm` or `yarn`.
The `.npmrc` has `shamefully-hoist=true` and `strict-peer-dependencies=false` to handle peer dep conflicts.
