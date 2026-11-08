#!/usr/bin/env node
// Claude Code PreToolUse hook for Bash (wired up in .claude/settings.json).
//
// Blocks git commands that would change `main` or `develop` directly or rewrite pushed
// history, and asks first before commands that throw away uncommitted work. GitHub's
// rulesets block the same pushes on the server (setup/github/); this catches them before
// they run, with a message that says what to do instead.
//
// Exit 2 + stderr blocks the call and the message goes back to Claude. A JSON
// "ask" decision on stdout makes Claude Code ask the person first. Anything this script
// can't parse is let through: the GitHub rules are the real wall, and a broken guard must
// never stop every shell command.

import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const PROTECTED = new Set(["main", "develop"]);
const WRAPPERS = new Set(["command", "env", "nice", "nohup", "time", "exec", "sudo"]);

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let command = "";
let cwd = process.cwd();
try {
  const input = JSON.parse(raw);
  command = String(input?.tool_input?.command ?? "");
  cwd = input?.cwd || cwd;
} catch {
  process.exit(0);
}

/** Split a shell command into simple commands (arrays of words), respecting quotes. */
function segments(cmd) {
  const segs = [];
  let words = [];
  let cur = "";
  let has = false;
  let quote = null;
  const flush = () => {
    if (cur || has) words.push(cur);
    cur = "";
    has = false;
  };
  const end = () => {
    flush();
    if (words.length) segs.push(words);
    words = [];
  };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    const n = cmd[i + 1];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === "\\" && quote === '"' && n !== undefined) {
        cur += n;
        i++;
      } else cur += c;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      has = true;
    } else if (c === "\\" && n !== undefined) {
      if (n !== "\n") cur += n;
      i++;
      has = true;
    } else if (c === "\n" || c === ";" || c === "(" || c === ")") end();
    else if (c === "&" && n === "&") {
      end();
      i++;
    } else if (c === "|") {
      end();
      if (n === "|" || n === "&") i++;
    } else if (c === "&" && cmd[i - 1] !== ">" && n !== ">") end(); // background &, not 2>&1 or &>
    else if (/\s/.test(c)) flush();
    else {
      cur += c;
      has = true;
    }
  }
  end();
  return segs;
}

function resolveDir(base, p) {
  if (!p || p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return path.resolve(base, p);
}

function currentBranch(dir) {
  try {
    return execFileSync("git", ["-C", dir, "branch", "--show-current"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const shortHas = (a, letter) => /^-[A-Za-z]+$/.test(a) && a.includes(letter);

/** Returns { deny?: string, ask?: string } for one `git push`. */
function checkPush(args, branch) {
  const VALUE_OPTS = new Set(["-o", "--push-option", "--repo", "--receive-pack", "--exec"]);
  const pos = [];
  let force = false;
  let del = false;
  let all = false;
  for (let k = 0; k < args.length; k++) {
    const a = args[k];
    if (a === "--") {
      pos.push(...args.slice(k + 1));
      break;
    }
    if (VALUE_OPTS.has(a)) {
      k++;
      continue;
    }
    if (a.startsWith("--")) {
      if (/^--(force|force-with-lease|force-if-includes)(=|$)/.test(a)) force = true;
      else if (a === "--mirror" || a === "--all" || a === "--branches") all = true;
      else if (a === "--delete" || a === "--prune") del = true;
      continue;
    }
    if (a.startsWith("-") && a.length > 1) {
      if (shortHas(a, "f")) force = true;
      if (shortHas(a, "d")) del = true;
      continue;
    }
    pos.push(a);
  }
  const refspecs = pos.slice(1);
  const targets = [];
  for (const r of refspecs) {
    if (r.startsWith("+")) force = true;
    const spec = r.replace(/^\+/, "");
    if (spec.startsWith(":")) del = true;
    let dst = spec.includes(":") ? spec.slice(spec.lastIndexOf(":") + 1) : spec;
    if (dst === "HEAD" || dst === "@") dst = branch;
    targets.push(dst.replace(/^refs\/heads\//, ""));
  }
  if (!refspecs.length && branch) targets.push(branch); // a bare push sends the current branch

  const hit = targets.find((t) => PROTECTED.has(t));
  if (all) return { deny: "This pushes every branch, including main and develop. Push only your change branch." };
  if (hit && del) return { deny: `This deletes ${hit} on GitHub. That branch is protected and must never be deleted.` };
  if (hit)
    return {
      deny:
        `This pushes straight to ${hit}. Changes reach ${hit} only through a pull request. ` +
        "Make a branch (git switch -c change/<short-name>), push that, and open a pull request into develop.",
    };
  if (force) return { deny: "Force-pushing rewrites history that's already on GitHub, so it isn't allowed here. Add a new commit instead." };
  if (del) return { ask: `This deletes ${targets.join(", ") || "a branch"} on GitHub.` };
  return {};
}

/** Returns { deny?: string, ask?: string } for one git invocation. */
function checkGit(args, dir) {
  // Skip git's own options (-C <dir>, -c key=value, --no-pager, ...).
  let j = 0;
  while (j < args.length && args[j].startsWith("-")) {
    const a = args[j];
    if (a === "-C") {
      dir = resolveDir(dir, args[j + 1]);
      j += 2;
    } else if (["-c", "--git-dir", "--work-tree", "--namespace"].includes(a)) j += 2;
    else j++;
  }
  const sub = args[j];
  const rest = args.slice(j + 1);
  if (!sub) return {};
  const branch = currentBranch(dir);

  if (sub === "push") return checkPush(rest, branch);

  if (["commit", "merge", "cherry-pick", "revert", "am"].includes(sub) && PROTECTED.has(branch)) {
    const updating = sub === "merge" && rest.some((a) => a === "--ff-only" || a === "--abort");
    if (!updating)
      return {
        deny:
          `You're on ${branch}, which only changes through pull requests. ` +
          "Make a branch first: git switch -c change/<short-name>.",
      };
  }

  if (sub === "reset" && rest.includes("--hard")) return { ask: "git reset --hard throws away uncommitted changes." };
  if (sub === "clean" && rest.some((a) => a === "--force" || shortHas(a, "f")))
    return { ask: "git clean deletes files git isn't tracking." };
  if (sub === "checkout" && rest.some((a) => a === "--" || a === "." || a === "-f" || a === "--force"))
    return { ask: "This checkout overwrites uncommitted changes." };
  if (sub === "restore" && rest.some((a) => !a.startsWith("-")) && (!rest.includes("--staged") || rest.includes("--worktree")))
    return { ask: "git restore throws away uncommitted changes in those files." };
  if (sub === "switch" && rest.some((a) => a === "--discard-changes" || a === "-f" || a === "--force"))
    return { ask: "This switch throws away uncommitted changes." };
  if (sub === "branch" && (rest.includes("-D") || (rest.some((a) => a === "-d" || a === "--delete") && rest.some((a) => a === "-f" || a === "--force"))))
    return { ask: "This deletes a branch even if its work was never merged." };
  if (sub === "stash" && ["drop", "clear"].includes(rest[0])) return { ask: "This deletes saved (stashed) work." };
  return {};
}

const denies = [];
const asks = [];
let dir = cwd;
for (const words of segments(command)) {
  if (words[0] === "cd") {
    dir = resolveDir(dir, words[1]);
    continue;
  }
  let i = 0;
  while (i < words.length) {
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i]) || WRAPPERS.has(words[i])) i++;
    else if (words[i] === "timeout") i += 2;
    else break;
  }
  const bin = words[i] ?? "";
  if (bin !== "git" && !bin.endsWith("/git")) continue;
  const result = checkGit(words.slice(i + 1), dir);
  if (result.deny) denies.push(result.deny);
  if (result.ask) asks.push(result.ask);
}

if (denies.length) {
  process.stderr.write(`Blocked by .claude/hooks/git-guard.mjs (see CLAUDE.md): ${denies.join(" ")}\n`);
  process.exit(2);
}
if (asks.length) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `${asks.join(" ")} Check with the person before running it.`,
      },
    }),
  );
}
process.exit(0);
