# Branching Model

The rules for how branches are created, promoted, and released in this repo.
Git + GitHub + Jira, run the way a GitHub maintainer would run it.

For the step-by-step "what do I type" version, see
[GIT-WORKFLOW.md](GIT-WORKFLOW.md).

---

## The three permanent branches

These branches live forever. Never delete them, never commit to them directly
— every change arrives through a Pull Request.

| Branch    | Meaning                                                    | Receives PRs from                 | Who approves                    |
|-----------|------------------------------------------------------------|-----------------------------------|---------------------------------|
| `develop` | Integration branch. All finished work lands here first.    | `feature/*` `bugfix/*` `chore/*`  | 1 reviewer                      |
| `stage`   | Pre-release. UAT / QA / final manual testing happen here.  | `develop` **only**                | 1 reviewer (QA lead)            |
| `main`    | Production source of truth. Always releasable.             | `stage` **only**, or `hotfix/*`   | 1 Code Owner (release approver) |

`main` is the default branch on GitHub.

> Other branches that exist in the repo today (for example `bug` and
> `optimizedevelopbranch`) predate this model. Do not branch from them; the
> maintainer merges anything still needed into `develop` and deletes them.

## Promotion is one direction only

```
feature/VCODE-12-…  ─PR─►  develop  ─PR─►  stage  ─PR─►  main  ─tag vX.Y.Z─►  RELEASE
bugfix/VCODE-15-…   ─┘
chore/VCODE-18-…    ─┘
```

- Code never skips a stage. It goes `develop` → `stage` → `main`, in order.
- `stage` only ever merges `develop`. `main` only ever merges `stage`
  (the one exception is `hotfix/*`, below).
- A merge into `main` is **not** a release. Tagging is (see below).

### Which merge button to use

| PR | GitHub merge button | Why |
|---|---|---|
| `feature/*` `bugfix/*` `chore/*` → `develop` | **Squash and merge** | One clean commit per ticket on `develop` |
| `develop` → `stage`, `stage` → `main` | **Create a merge commit** | Keeps the branches sharing history |
| `hotfix/*` → `main` | **Squash and merge** | One clean commit for the fix |
| Back-merge `main` → `stage` / `develop` | **Create a merge commit** | Same reason as promotion |

Never squash a promotion or back-merge PR. A squash creates new commits that
`develop` does not have, so the branches drift apart: every later promotion
shows old changes again and produces conflicts that are not real.

## Short-lived branches

Created off `develop` (or `main` for hotfixes), deleted right after merge.

| Prefix      | Branch off | Merge back into                                  | Use for                                       |
|-------------|------------|--------------------------------------------------|-----------------------------------------------|
| `feature/`  | `develop`  | `develop`                                        | New functionality                             |
| `bugfix/`   | `develop`  | `develop`                                        | Fixing a bug found in `develop` / `stage`     |
| `chore/`    | `develop`  | `develop`                                        | Deps, config, docs, refactors, tooling        |
| `hotfix/`   | `main`     | `main`, then back-merge to `stage` + `develop`   | Urgent production bug that can't wait for the normal cycle |

### Naming

```
<prefix>/<JIRA-KEY>-<short-kebab-summary>
```

Examples:

```
feature/VCODE-12-scroll-reorder
bugfix/VCODE-15-logo-bug-stop-button
chore/VCODE-18-bump-vite-6-1
hotfix/VCODE-27-login-redirect-loop
```

The Jira key in the branch name is what makes the branch show up on the Jira
ticket automatically. Always include it.

---

## Releases and tags

Releases are cut on `main` only, using **Semantic Versioning**: `vMAJOR.MINOR.PATCH`.

| Bump  | Example           | When                                    |
|-------|-------------------|-----------------------------------------|
| MAJOR | `v1.4.2 → v2.0.0` | Breaking change to behaviour or config  |
| MINOR | `v1.4.2 → v1.5.0` | New feature, backward compatible        |
| PATCH | `v1.4.2 → v1.4.3` | Bug fix only, no new behaviour          |

```bash
git checkout main
git pull origin main
git tag -a v1.5.0 -m "v1.5.0"
git push origin v1.5.0
```

Then on GitHub: **Releases → Draft a new release → choose tag `v1.5.0` →
Generate release notes → Publish**. Record the same notes in
[CHANGELOG.md](../CHANGELOG.md), and keep the `version` in `package.json` in
step with the tag.

A tag is a permanent, named snapshot. It is the thing you check out to
reproduce or roll back a release:

```bash
git checkout v1.4.2        # inspect the previous release
```

---

## Hotfix flow (urgent production bug)

```bash
git checkout main && git pull origin main
git checkout -b hotfix/VCODE-27-login-redirect-loop

# fix, commit (see commit rules in GIT-WORKFLOW.md), push
git push -u origin hotfix/VCODE-27-login-redirect-loop
```

1. Open a PR into `main`. Get the release approver's review. Merge.
2. Tag a PATCH release on `main` and push the tag.
3. **Back-merge** so the fix isn't lost on the next promotion. Branch
   protection blocks direct pushes, so this is done with two PRs on GitHub,
   each merged with **Create a merge commit**:

```
GitHub → New Pull Request → base: stage   ← compare: main
GitHub → New Pull Request → base: develop ← compare: main
```

   If a PR has conflicts, resolve them on a branch made from `main`
   (`git checkout -b chore/VCODE-27-back-merge main`, `git merge origin/develop`,
   fix, push) and open the PR from that branch instead.

Skipping step 3 means the next `develop → stage → main` promotion
silently reverts your hotfix.

---

## Branch protection (GitHub → Settings → Branches)

Configure one rule per permanent branch. This is how a maintainer enforces the
model — without it, the rules above are just etiquette.

| Setting                                      | `develop` | `stage` | `main` |
|----------------------------------------------|:---------:|:-------:|:------:|
| Require a pull request before merging        | ✅        | ✅      | ✅     |
| Require approvals                            | 1         | 1       | 1      |
| Require review from Code Owners              | —         | —       | ✅     |
| Dismiss stale approvals on new commits       | ✅        | ✅      | ✅     |
| Require conversation resolution before merge | ✅        | ✅      | ✅     |
| Require branches to be up to date            | —         | ✅      | ✅     |
| Require linear history (squash/rebase only)  | —         | —       | —      |
| Do not allow bypassing the above             | ✅        | ✅      | ✅     |

"Require linear history" stays off: it forbids merge commits, which the
promotion and back-merge PRs need (see
[Which merge button to use](#which-merge-button-to-use)).

Also:

- **Settings → General → Pull Requests**: enable "Allow squash merging" and
  "Allow merge commits", disable "Allow rebase merging", and check
  "Automatically delete head branches" (permanent branches are protected, so
  they are never auto-deleted).
- **Code Owner review needs a second person.** GitHub never lets the author of
  a PR approve it. If the only code owner opens a PR into `main`, nobody can
  satisfy the rule — add a second owner to CODEOWNERS, or have someone else
  open the `stage → main` PR.
- **Private repos:** branch protection rules on a private repository need a
  paid GitHub plan (Pro, Team or Enterprise). On the Free plan the settings
  page shows them but GitHub does not enforce them.
- **Settings → Branches → Add tag protection rule**: pattern `v*` restricted to
  the release-manager team (optional but recommended).
- Keep [`.github/CODEOWNERS`](../.github/CODEOWNERS) current so the `main`
  review requirement can actually be satisfied.

---

## One-line summary

> Branch off `develop` with a `feature/VCODE-…` name → PR into `develop` →
> promote `develop` → `stage` → `main` by PR → tag `vX.Y.Z` on `main` to
> release. Hotfixes branch off `main` and are back-merged down.
