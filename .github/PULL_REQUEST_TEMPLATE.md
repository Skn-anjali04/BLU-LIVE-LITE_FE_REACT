<!-- Title must be:  VCODE-<n>: <short imperative summary> -->

## Jira ticket

<!-- Link the ticket. The VCODE key in the title + this link connect the PR to Jira. -->
- VCODE-

## What & why

<!-- What does this change do, and why is it needed? -->

## How to test

<!-- Steps a reviewer follows to verify it. Name the role (Admin / Tech / Operator) and screen. -->
1.
2.

## Checklist

- [ ] Branch is named `<prefix>/VCODE-<n>-<summary>` and targets the correct base
      (`develop` for feature/bugfix/chore; `main` for hotfix)
- [ ] Every commit subject starts with `VCODE-<n>:` and is in the imperative
- [ ] `npm run lint` is clean for the files I changed
- [ ] `npm run build` succeeds
- [ ] Ran the app (`npm run dev`) and verified the change for the affected role(s)
- [ ] No secrets / `.env` / `env.js` / keys / real server IPs committed
- [ ] README or docs updated if behaviour or setup changed
- [ ] Jira ticket moved to **In Review**

## Screenshots / notes

<!-- Optional: UI before/after, edge cases, follow-ups. -->
