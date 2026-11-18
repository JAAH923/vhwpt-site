# Handing the repo to Bruce: GitHub, rules and his Claude

The goal is for Bruce to own the site and change it with his own Claude Code, without being
able to break www.vhwpt.com. Four layers stop him, and each one holds even if the one above
it slips:

| Layer | What it stops | Can Bruce's Claude change it? |
|---|---|---|
| GitHub rulesets (`setup/github/`) | Pushes to `main` or `develop`, force-pushes, merges with a failing build, changes to sensitive files without Justin, anything reaching `main` except from `develop` | No. His token has no admin rights |
| His GitHub token | Repo settings, workflows, secrets, any other repo | No |
| Managed settings on his Mac (`setup/bruce/`) | AWS commands, edits to `.github/`, `.claude/`, `CLAUDE.md`, `setup/`, `deploy/`, bypass mode. Server commands (`ssh`, `scp`, `sudo`…) always ask him first | No. Changing them needs his Mac password |
| `CLAUDE.md` and `.claude/` in the repo | Catches mistakes early and explains them in plain words | Only through a pull request Justin approves (CODEOWNERS) |

Bruce can release: he merges `develop` into `main` (step 2) and runs the deploy on his own
server (`ssh bruce-lightsail /srv/sites/vhwpt/deploy.sh`), with his own SSH key (step 3.4).
It's his server, so his key gets the same access as Justin's; his Claude asks him before every
server command. Justin keeps a daily copy of the live site so any day can be put back.

The org name `vhwpt` below is an example. Swap in the real one everywhere.

## 1. GitHub org (Bruce and Justin, about 15 minutes)

1. **Bruce:** sign up at https://github.com/signup with his vhwpt.com email. Turn on two-factor
   sign-in (Settings > Password and authentication) with an authenticator app, and keep the
   recovery codes somewhere besides that laptop.
2. **Bruce:** create a free organization (https://github.com/account/organizations/new, Free
   plan), for example `vhwpt`. Invite `JAAH923` as an **Owner**. Two owners means neither can
   be locked out.
3. **Justin:** accept the invite. Create a team called `maintainers` (org > Teams > New team)
   with only himself in it. It is the only thing allowed to bypass the rules.
4. **Justin:** transfer the repo: `JAAH923/vhwpt-site` > Settings > General > Danger Zone >
   Transfer, to `vhwpt`. Old GitHub URLs redirect, but point the local copy at the new one
   anyway:
   ```sh
   git remote set-url origin https://github.com/vhwpt/vhwpt-site.git
   ```
5. **Justin:** make `develop` the default branch, so new pull requests aim at staging:
   ```sh
   gh repo edit vhwpt/vhwpt-site --default-branch develop
   ```
6. **Justin:** in org settings > Personal access tokens, allow fine-grained tokens and keep
   "require approval" on. Bruce's token (step 3.2) then waits for one approval.
7. **Staging moves** to `https://vhwpt.github.io/vhwpt-site/`. Check Settings > Pages (source:
   GitHub Actions), then update `site` in `astro.config.mjs`, the staging link in `CLAUDE.md`,
   and any links on task-core (T-830, T-909) or pho-status.

Keep the repo **public**. On the free plan, GitHub Pages and rulesets only work on public
repos (private needs GitHub Team). Nothing secret is in the repo, and the CI check fails any
pull request that tries to add a key.

## 2. Branch rules (Justin, 5 minutes)

From the repo root, with Justin's own `gh` login:

```sh
TEAM_ID=$(gh api orgs/vhwpt/teams/maintainers --jq .id)
for f in develop main; do
  jq --argjson id "$TEAM_ID" \
    '.bypass_actors = [{"actor_id": $id, "actor_type": "Team", "bypass_mode": "pull_request"}]' \
    "setup/github/ruleset-$f.json" |
    gh api repos/vhwpt/vhwpt-site/rulesets --method POST --input -
done
```

What they do:
- **develop (staging):** a pull request and a passing `build` check are required. A change to
  any path in `.github/CODEOWNERS` also needs Justin's approval. Everything else (copy, Q&A
  answers, photos) Bruce can merge himself. No force-push and no deletion.
- **main (production):** a pull request and a passing build. The build check fails any pull
  request into `main` that doesn't come from `develop`, so everything going live already
  passed Justin's review on its way to staging. Bruce or Justin can merge. No force-push and
  no deletion.

Justin's own pull requests that touch code-owned paths merge through his bypass: `gh pr merge <n> --merge --admin`, or tick "Merge without
waiting for requirements" in GitHub.

**Check the rules before Bruce starts:**
1. A pull request into `develop` that changes only `src/data/site.ts` merges once `build`
   passes.
2. One that changes `src/styles/site.css` waits for Justin's review.
3. `git push origin develop` from Bruce's login is rejected.
4. A pull request into `main` from any branch but `develop` fails the `build` check.

## 3. Bruce's Mac (on a call, about 30 minutes)

1. **Install the tools.**
   - git: `xcode-select --install`
   - Node 22 LTS from https://nodejs.org (the macOS installer), then `corepack enable` for pnpm.
   - GitHub CLI from https://cli.github.com
   - Claude Code: `curl -fsSL https://claude.ai/install.sh | bash`, then sign in with his own
     Claude plan.
2. **His GitHub token.** On github.com: Settings > Developer settings > Personal access tokens
   > Fine-grained tokens > Generate new token.
   - Name `claude-vhwpt`, expiry 90 days, resource owner `vhwpt`.
   - Repository access: only `vhwpt-site`.
   - Repository permissions: **Contents: Read and write**, **Pull requests: Read and write**.
     Metadata turns on by itself. Leave everything else at No access, especially
     Administration, Workflows, Secrets, Variables and Environments.
   - Approve it in the org if GitHub asks. Then in Terminal, `gh auth login`: GitHub.com >
     HTTPS > Paste an authentication token. Bruce pastes it himself and never sends it to
     anyone. Then run `gh auth setup-git` so git uses it.
   - GitHub emails him before it expires. Making a new one with the same settings is all a
     renewal takes.
3. **Get the site.** Use his GitHub "noreply" address (Settings > Emails) so his real email
   stays off the public history:
   ```sh
   git config --global user.name "Bruce Valencia"
   git config --global user.email "<id>+<username>@users.noreply.github.com"
   mkdir -p ~/Sites && cd ~/Sites
   git clone https://github.com/vhwpt/vhwpt-site.git && cd vhwpt-site
   pnpm install
   ```
4. **His key to the server.** It's his server, so he adds his own key, with no one else
   handling it. In Terminal on his Mac:
   ```sh
   ssh-keygen -t ed25519 -C "bruce@vhwpt" -f ~/.ssh/id_ed25519   # Enter twice (or set a passphrase)
   cat >> ~/.ssh/config <<'CFG'
   Host bruce-lightsail
     HostName 3.226.58.165
     User ubuntu
     IdentityFile ~/.ssh/id_ed25519
   CFG
   pbcopy < ~/.ssh/id_ed25519.pub    # copies the public half; it's safe to share
   ```
   Then in the Lightsail console, open the server (VHAW) > **Connect using SSH**, and in that
   browser terminal type `cat >> ~/.ssh/authorized_keys`, paste, press Enter, then Control-D.
   Back in Terminal, `ssh bruce-lightsail whoami` should print `ubuntu`. If it times out, his
   network blocks port 22; Tailscale fixes that (T-960).
5. **Lock his Claude down.** This needs his Mac password once. It applies to every Claude Code
   session on his Mac, and nothing Claude runs can change it:
   ```sh
   sudo mkdir -p "/Library/Application Support/ClaudeCode"
   sudo cp setup/bruce/managed-settings.json "/Library/Application Support/ClaudeCode/managed-settings.json"
   ```
6. **Check it.** In the repo, run `claude`, then type `/permissions`: the ask and deny lists
   should show. Ask it to "push this straight to main": the hook blocks it and explains why.
   Ask it to "check the server is up with ssh": it asks him first.

## 4. First change together

Bruce asks his Claude in plain words. `CLAUDE.md` loads by itself, so he doesn't need a
special prompt. Good first asks:
- "Change the phone number on the site to …"
- "On the Questions page, the Medicare-at-home answer is right. Remove the to-confirm note."
- "Show me the staging link for the About page."

Follow one all the way: Claude makes a branch, builds, opens a pull request, the check passes,
Bruce says it looks right, Claude merges into `develop`, and Bruce checks staging. Then he
says "put it live": Claude opens the pull request from `develop` into `main`, merges it once
the check passes, runs the deploy and gives him the live link. Then try one that touches
styling, to show it waiting for Justin.

## Files

| File | What it is |
|---|---|
| `CLAUDE.md` | Rules any Claude in this repo reads first |
| `.claude/settings.json` | Shared settings: the git guard hook, no reading secrets |
| `.claude/hooks/git-guard.mjs` | Blocks pushes and commits to `main` or `develop` and force-pushes. Asks before `reset --hard`, `clean` and the like |
| `.github/CODEOWNERS` | Paths that need Justin's approval |
| `.github/workflows/ci.yml` | The required `build` check: site builds, no keys or server files committed |
| `setup/github/ruleset-*.json` | The two branch rulesets, applied in step 2 |
| `setup/bruce/managed-settings.json` | Bruce's machine-wide Claude Code limits, installed in step 3.5 |
