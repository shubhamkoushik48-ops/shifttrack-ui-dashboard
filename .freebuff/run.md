# ShiftTrack — Preview Run Doc

## How to reproduce the artifacts

1. Install dependencies (npm, lockfile `package-lock.json` in repo root):
   ```
   npm install --no-audit --no-fund
   ```
2. Environment: a `.env.local` exists in the repo root (added by the user,
   commit d0b3df7) pointing at a real backend:
   `NEXT_PUBLIC_API_URL=http://localhost:5000/api`, `NEXT_PUBLIC_WS_URL=http://localhost:5000`,
   `NEXT_PUBLIC_ENABLE_WS=false`. The real backend is tried first for every
   request; when it is NOT running (or returns 404 for an endpoint it has not
   implemented), `src/lib/api-client.ts` transparently falls back to the
   built-in mock router (`src/mock/api.ts`), so the preview works with or
   without the backend. The console logs `[api] backend unavailable — mock
   served …` lines when the fallback engages. Realtime uses the built-in
   simulator while `NEXT_PUBLIC_ENABLE_WS=false`.
3. No database or build artifacts are needed before `npm run dev` — Next.js
   compiles on first request.

## How to run the server

1. Default dev port is **3100** (set in `package.json`: `next dev -p 3100`).
   If 3100 is occupied, pick a free port and run `npm run dev -- -p <port>`
   instead (no config change needed — the flag overrides).
2. Start detached (Windows, PowerShell), logging to two different files:
   ```
   powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
   ```
3. Confirm the process survived and the URL answers:
   ```
   powershell -NoProfile -Command "Get-Process -Id <pid>"
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/login
   ```
4. Register `http://localhost:3100/login` with the returned pid.
5. Login: any email + password of 8+ characters (mock auth). The dashboard
   lives under `/dashboard/*`.

## Troubleshooting

- **500 on pages with `TypeError: Cannot read properties of undefined
  (reading 'call')` in the log** — the `.next` cache is corrupted, usually
  because `npm run build` (production) was executed while the dev server was
  running: both write to `.next`. Fix: stop the dev server, `rm -rf .next`,
  start it again. Avoid production builds while the dev server is live.
- **404 for a newly added route** — the dev server was started before the
  route file existed and serves a stale manifest. Restart the server.
- **Console floods with `net::ERR_CONNECTION_REFUSED` to `localhost:5000`** —
  the user's real backend (see `.env.local`) is not running. Not fatal: the
  mock fallback serves every request and the app works normally. Start the
  real backend on port 5000 to exercise the real API instead.
- **`Start-Process` timeout caveat** — the pid it prints is `npm.cmd`'s
  wrapper, not node. The LISTENING socket's pid (check `netstat -ano`) is the
  real Next.js pid to use with `register_preview`.
- **PowerShell `Start-Process` appears to hang** — it does not exit while
  `npm.cmd` runs; the server still starts. Wrap the launch in a backgrounded
  shell command and then verify with `netstat -ano | grep :3100`.
