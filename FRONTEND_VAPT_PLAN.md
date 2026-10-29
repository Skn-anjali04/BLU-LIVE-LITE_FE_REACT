# BlueLive-Lite Frontend — VAPT changes (final)

Report: `First_Audit_WEB_VAPT_Report_Skandha.docx` (17 findings). Backend: branch `vapt/first-audit` of `BLU-LIVE-LITE_BE` (`VAPT_REMEDIATION_PLAN.md`).
Undo steps: `VAPT_REVERT.md` in this repo.

The backend keeps the Ateme token and passwords on the server (V004/V005), so **no screen code changes** are needed here. The frontend only needed the env-based config, the web-server config and the removal of the browser key pair.

## What changed (Jira VCODE-289, branch `bugfix/VCODE-289-frontend-vapt`)

Merge the PR with **Create a merge commit** (not squash) so these commits, and the revert steps in `VAPT_REVERT.md`, stay valid.

| Commit | Change | Findings |
|---|---|---|
| F0 baa836b | API address and login public key come from Vite env (`VITE_BLULIVE_API_URL`, `VITE_BLULIVE_API_PORT`, `VITE_BLULIVE_RSA_PUBLIC_KEY`) instead of hardcoded server IPs (`constants.jsx`) and a PEM block in `LoginCard.jsx` | — |
| F1 f310f03 | `apache/bluelive.conf` + 3 lines in `Dockerfile`: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, no directory listing, no Apache version | V010–V014, INF002 |
| F2 260323e | `encrypt-decrypt.jsx` no longer uses the bundled key pair (role/email stored as plain text, display only; the backend enforces roles). `VITE_BLULIVE_LOCAL_*` removed from `.env`, `.env.production`. `.gitignore` protects the report | INF001 |
| F3 | This document and `VAPT_REVERT.md` | — |

Login is unchanged: `LoginCard.jsx` still encrypts the password with `VITE_BLULIVE_RSA_PUBLIC_KEY` (a public key, safe in the browser). Users logged in at deploy time log in once more.

## Settings
- `API_ORIGIN` (Docker env, default `http://34.47.174.27:8000`) is the API origin allowed by the CSP `connect-src`. Set it to the API URL the build calls (`VITE_BLULIVE_API_URL:VITE_BLULIVE_API_PORT`).
- After the backend moves to HTTPS (INF003): `VITE_BLULIVE_API_URL=https://…` in `.env.production`, `API_ORIGIN=https://…`, add HSTS in `apache/bluelive.conf`; backend `CORS_ORIGINS` / `ENABLE_HSTS=true`.
- When the backend login key pair is rotated, put the new public key body in `VITE_BLULIVE_RSA_PUBLIC_KEY` (localhost `.env` is already updated for the rotated local keys).

## Verified on localhost (23.10.2026)
`docker build` + `docker run -p 8088:80 -e API_ORIGIN=http://localhost:8000 bluelive-fe:vapt-test`:
- `/` → all five headers present, `Server: Apache` (no version)
- `/assets/` → 403 (no listing)
- served bundle: only `BEGIN PUBLIC KEY`, no private key
- built `index.html` has no inline scripts (CSP-safe); the only `new Worker` calls are inside node-forge key generation, which the app does not use

## Manual check in the browser (about 15 min)
1. `npm run dev` (http://localhost:5173) with the backend on :8000: log in, wrong password shows the generic message.
2. Admin: create/delete user, add server (IP or DNS name), edit server without touching the password (dots are a placeholder), assign/unassign, logs download.
3. Operator: lobby → dashboard: status, logo/bug start/stop, slate, cue-out/cue-in, scrolls, SCTE panel. The Ateme servers must be reachable from your PC (VPN) for this part.
4. Docker build (`http://localhost:8088`): DevTools Console shows no CSP errors on any screen.
