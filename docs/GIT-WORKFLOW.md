# Git Workflow — follow this before every commit

This is the day-to-day procedure. It ties every branch, commit, and Pull
Request to a **Jira ticket** (project key `VCODE`, e.g. `VCODE-2`, `VCODE-3`).

Branch model reference: [BRANCHING.md](BRANCHING.md).

---

## 0. One-time setup (each developer, once per clone)

```bash
# use the shared hooks in this repo (enforces the commit rules below)
git config core.hooksPath .githooks

# use the shared commit message template
git config commit.template .gitmessage.txt

# identity — the email MUST match your Atlassian/Jira account email
git config user.name  "Your Name"
git config user.email "you@skandhams.com"

# local settings (never committed)
cp .env.example .env
```

On macOS/Linux also make the hooks executable once: `chmod +x .githooks/*`.

To connect the repo to Jira (org admin, once for the whole repo): install the
**GitHub for Jira** app from the Atlassian Marketplace and link this
repository. After that, Jira automatically shows every branch, commit, and PR
that mentions a `VCODE-…` key on the matching ticket's **Development** panel.

---

## 1. Pick up a Jira ticket

1. On the Jira board, assign the ticket to yourself and move it **To Do → In Progress**.
2. Note the key, e.g. `VCODE-2`.

## 2. Create the branch (always off up-to-date `develop`)

```bash
git checkout develop
git pull origin develop

git checkout -b feature/VCODE-2-scroll-reorder
```

Prefix rules — see [BRANCHING.md](BRANCHING.md#short-lived-branches):
`feature/` · `bugfix/` · `chore/` (off `develop`), `hotfix/` (off `main`).

Format: `<prefix>/<JIRA-KEY>-<short-kebab-summary>`.

## 3. Do the work — commit in small, focused steps

Stage only what belongs to this change and commit often.

```bash
git add src/screens/playout-dashboard/components/scroll-component.jsx
git commit          # opens the editor with .gitmessage.txt as a guide
```

### Commit message format (enforced by `.githooks/commit-msg`)

```
<JIRA-KEY>: <imperative summary, <= 72 chars>

<why the change is needed and what it does — wrap at 72 columns>

<optional Jira Smart Commit commands, see below>
```

Real example:

```
VCODE-2: add reorder option to scroll texts

Operators had to delete and re-create scroll texts to change the
order they play in. Adds up/down buttons to the Create Scroll dialog
and saves the new order with the existing addScrolls call.

VCODE-2 #comment Added up/down reorder buttons to the scroll dialog
VCODE-2 #time 3h
```

Rules the hook checks:

- Subject line **must contain a `VCODE-<number>` key**.
- Subject line **must be 72 characters or fewer**.
- No trailing period on the subject.
- No AI `Co-authored-by:` trailers.
- `Merge`, `Revert`, `fixup!`, `squash!` commits are allowed through as-is.
- Bypass in a real emergency only: `git commit --no-verify`.

Style rules the hook does not check but reviewers will:

- Imperative mood: "add", "fix", "remove" — not "added" / "fixes".
- Blank line between subject and body.
- One logical change per commit.
- **No `Co-authored-by:` trailers for AI tools** (Claude, Copilot, etc.). The
  commit author is the developer who made the change. Configure your editor /
  assistant to not append them.

Good and bad subjects:

| ✅ Good                                          | ❌ Bad                          |
|--------------------------------------------------|--------------------------------|
| `VCODE-14: fix stop button on logo/bug card`       | `fixed bug`                    |
| `VCODE-20: add date validation to logs download`   | `VCODE-20: Added validation.`    |
| `VCODE-31: remove unused imports in servers tab`   | `changes`                      |

### Jira Smart Commits (optional, powerful)

If your committer email matches your Jira account, these commands in the
commit **body** act on the ticket when the branch is pushed:

| Command                    | Effect on the Jira ticket                                 |
|----------------------------|-----------------------------------------------------------|
| `VCODE-2 #comment <text>`    | Adds `<text>` as a comment                                |
| `VCODE-2 #time 2h 30m`       | Logs 2h30m of work                                        |
| `VCODE-2 #in-progress`       | Transitions the ticket (name = board column, kebab-case)  |
| `VCODE-2 #review`            | Transitions to your "In Review" column                    |
| `VCODE-2 #done`              | Transitions to Done                                       |

Use the transition that matches your board's column names exactly.

## 4. Before you push — the pre-commit checklist

The `.githooks/pre-commit` hook runs automatically on every commit. It:

- **blocks** `.env`, `.env.production`, `env.js`, `kenv.js`, `*.pem`, `*.key`
  and `*.bak` files (`.env.example` is allowed);
- runs **ESLint on the staged JS/JSX files** and blocks the commit on errors.

Some older files still have lint errors (mostly unused variables). When you
change one of them, fix its errors in the same commit — the code base gets
cleaner one file at a time.

Things to know about the hooks:

- They only run after the one-time `git config core.hooksPath .githooks`
  (step 0), and only on your machine. GitHub does not run them, so reviewers
  still check commit messages in the PR.
- ESLint checks the file as it is on disk. If you staged only part of a file
  (`git add -p`), the unstaged part is linted too.
- Run `npm install` first. Without `node_modules`, `npx eslint` cannot find
  the project's ESLint.
- Committing from VS Code's Source Control panel runs the same hooks. If the
  commit fails there, open **Output → Git** to read the message.

Also confirm by hand:

- [ ] On the right branch, named `<prefix>/VCODE-<n>-<summary>`.
- [ ] `git pull --rebase origin develop` — no merge bubble, conflicts resolved.
- [ ] `npm run build` succeeds.
- [ ] The app runs: `npm run dev`, and the change works for the affected
      role(s) — Admin / Tech (Admin Panel) or Operator (Lobby, Dashboard).
- [ ] `git status` / `git diff --cached` — only intended files staged.
- [ ] **No secrets committed** — no `.env`, keys, tokens or real server IPs.
- [ ] Every commit subject has the `VCODE-` key and reads in the imperative.

## 5. Push and open the Pull Request

```bash
git push -u origin feature/VCODE-2-scroll-reorder
```

On GitHub, open a PR with:

- **Base branch**: `develop` (never `stage` or `main` from a feature branch).
- **Title**: `VCODE-2: add reorder option to scroll texts`
  (the key in the title links the PR to the ticket).
- **Description**: fill in [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md)
  (GitHub pre-fills it).
- Move the Jira ticket to **In Review**.

Then:

1. Request a reviewer.
2. Address comments with more commits (don't force-push during review).
3. When approved, **Squash and merge**. Edit the squash commit message so it
   still starts with `VCODE-2:`.
4. Delete the branch (GitHub does this automatically if configured).
5. Move the Jira ticket to its next state (e.g. **Ready for QA**).

## 6. Promote to stage (release manager / whoever owns the cut)

When `develop` is stable and ready for QA:

```
GitHub → New Pull Request → base: stage ← compare: develop
Title: "Release candidate <next-version>, e.g. v1.5.0"
```

Merge after review with **Create a merge commit** (never squash a promotion —
see [BRANCHING.md](BRANCHING.md#which-merge-button-to-use)). QA / UAT test on `stage`. Bugs found here get a
`bugfix/VCODE-…` branch **off `develop`**, merged to `develop`, then
`develop` is promoted to `stage` again. Never commit straight to `stage`.

## 7. Promote to main + release

```
GitHub → New Pull Request → base: main ← compare: stage
```

Needs a Code Owner (release approver) review. Merge with **Create a merge
commit**. After merge, cut the release:

```bash
git checkout main && git pull origin main
git tag -a v1.5.0 -m "v1.5.0"
git push origin v1.5.0
```

Then draft the GitHub Release from that tag and update
[CHANGELOG.md](../CHANGELOG.md). See
[BRANCHING.md](BRANCHING.md#releases-and-tags).

---

## Quick reference

```bash
# start
git checkout develop && git pull origin develop
git checkout -b feature/VCODE-2-short-summary

# work
git add -p
git commit                      # "VCODE-2: imperative summary"

# sync + ship
git pull --rebase origin develop
npm run lint && npm run build
git push -u origin feature/VCODE-2-short-summary
#   -> open PR into develop, title "VCODE-2: ..."

# promote (PRs on GitHub)
#   develop -> stage -> main

# release (on main)
git tag -a v1.5.0 -m "v1.5.0" && git push origin v1.5.0
```

## Jira ticket lifecycle mapped to Git

| Jira status  | Git / GitHub action                                     |
|--------------|---------------------------------------------------------|
| To Do        | Ticket assigned, not started                            |
| In Progress  | `feature/VCODE-…` branch created, commits made            |
| In Review    | PR opened into `develop`                                |
| Ready for QA | PR merged to `develop`; included in the `stage` promotion |
| Done         | Change is on `main` and shipped in a `vX.Y.Z` tag       |
