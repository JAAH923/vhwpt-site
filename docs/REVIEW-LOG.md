# Review log — vhwpt.com

Every change requested through the client review artifact, and what happened to
it. Append-only: entries are never edited or deleted once written, including the
ones that were declined.

Artifact: https://claude.ai/code/artifact/2c1ae741-4d12-4b00-8df6-a41ad2c8ce73

## How to read it

| Column | Meaning |
| --- | --- |
| Date | When the request was actioned, not when it was written |
| Page · block | Where the comment was anchored, as the review page labels it |
| Asked by | The commenter, as the platform attributed them |
| Request | What they asked for, in their own words where short enough |
| Outcome | `done`, `declined`, `needs Bruce`, or `deferred` — never blank |
| Commit | The sha, or `—` when no code changed |
| Thread | `replied + resolved`, or why not |

A thread can only be replied to or resolved if the commenter sent it to Claude.
One that was actioned but left open is logged as `open — not sent to Claude`,
because the alternative is a log that claims threads were closed when they were
not.

## Why declined requests are logged too

Three of the seven open decisions touch Bruce's scope of practice, his rates, or
a claim about the practice. Those are his to make, not ours to action from a
comment. When a request in that category arrives it gets logged as
`needs Bruce` with the reason, so there is a record of what was asked and why it
was not simply done.

---

## Entries

### 2026-09-20 · "Brooklyn, New York" on the About block

- **Page · block:** Home · About, moved up the page (`home-about`)
- **Asked by:** Bruce Valencia
- **Request:** "Brooklyn, New York"
- **Outcome:** done
- **Commit:** 75d27f2
- **Thread:** resolved in the store; no reply sent (the self-hosted panel has no
  reply verb, only resolve)
- **Notes:** Asked rather than guessed, and the answer was both readings at once:
  he grew up in **Brooklyn** and trained clients **across Manhattan**. Neither
  single reading would have been right, so guessing would have published a false
  biographical claim either way. Corrected in three places — the Home About lead,
  the About page story lead, and the About heading, which became "From Brooklyn to
  a doctorate". The legacy WordPress copy had said "Growing up in Manhattan", so
  this error predates the rebuild and has been on his site for years.

<!--
Entry template — copy, fill, append at the bottom. Newest last.

### YYYY-MM-DD · <short title>

- **Page · block:** Services · Personal Training
- **Asked by:** <name as attributed>
- **Request:** "<their words>"
- **Outcome:** done
- **Commit:** abc1234
- **Thread:** replied + resolved
- **Notes:** anything a future reader would need — what was interpreted, what
  was deliberately left alone.
-->
