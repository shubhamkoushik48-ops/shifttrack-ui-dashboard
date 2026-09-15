# ShiftTrack — Preview Run Doc

## How to reproduce the artifacts

1. Install dependencies (npm, lockfile `package-lock.json` in repo root):
   ```
   npm install --no-audit --no-fund
   ```
2. Environment: the app runs fully offline on a deterministic in-repo mock backend.
   No `.env.local` is required. If real backend wiring is wanted later, copy
   `.env.example` to `.env.local` and fill `NEXT_PUBLIC_API_URL` /
   `NEXT_PUBLIC_WS_URL` / `NEXT_PUBLIC_ENABLE_WS=true`.
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
- **PowerShell `Start-Process` appears to hang** — it does not exit while
  `npm.cmd` runs; the server still starts. Wrap the launch in a backgrounded
  shell command and then verify with `netstat -ano | grep :3100`.
