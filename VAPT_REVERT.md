# Frontend — how to undo the VAPT changes

Jira VCODE-289, branch `bugfix/VCODE-289-frontend-vapt`. These commit IDs stay valid only if the
PR was merged with **Create a merge commit** (a squash merge replaces them with one new commit).

Go back to the state **before** a step by reverting that step together with every later step,
newest first. `DOCS` is the commit that added this file: `git log --oneline -- VAPT_REVERT.md`.
Tested: each of these applies cleanly and gives back exactly the earlier code.
Reverting a middle commit on its own may conflict, because later commits touch the same files.

| Step | What | Go back to before this step |
|---|---|---|
| F0 baa836b | API address + login public key from env | `git revert --no-edit DOCS 260323e f310f03 baa836b` |
| F1 f310f03 | Apache headers + no directory listing | `git revert --no-edit DOCS 260323e f310f03` |
| F2 260323e | Browser key pair removed | `git revert --no-edit DOCS 260323e`, then restore the env files (below) |
| F3 DOCS | Docs | `git revert --no-edit DOCS` |

## Undo everything
```bash
git revert --no-edit DOCS 260323e f310f03 baa836b
copy .env.pre-vapt.bak .env
copy .env.production.pre-vapt.bak .env.production
npm run dev            # or rebuild the Docker image
```
The `*.pre-vapt.bak` files hold the env files exactly as they were (incl. the old login public key and the
browser key pair). They are git-ignored. Delete them once you are sure.

If the backend keys are restored too (backend `VAPT_REVERT.md`), `.env.pre-vapt.bak` already contains the
matching old login public key.

Back to the fixed version: revert the revert commits (`git revert --no-edit <revert commits>`), then
```bash
copy .env.vapt.bak .env
copy .env.production.vapt.bak .env.production
```

## Only the Apache headers cause a problem
Edit `apache/bluelive.conf` (e.g. relax a CSP directive) and rebuild, or set `API_ORIGIN` for the API
address. The CSP can be tried in report-only mode by renaming the header to
`Content-Security-Policy-Report-Only`.
