---
name: loop
description: Run a prompt or slash command on a recurring interval
usage: /loop [interval] [command]
examples:
  - /loop 5m /simplify
  - /loop 10m check deploy status
  - /loop 30s poll for new leads
---

# Loop: Recurring Task Runner

## Usage

```
/loop [interval] [command or prompt]
```

**Default interval:** 10 minutes (if not specified)

## Interval Formats

| Format | Example | Meaning |
|--------|---------|---------|
| `Xs` | `30s` | Every 30 seconds |
| `Xm` | `5m` | Every 5 minutes |
| `Xh` | `1h` | Every 1 hour |

## Examples

```
/loop 5m /simplify
→ Run /simplify every 5 minutes

/loop 10m check if deploy succeeded on Cloudflare Pages
→ Poll deploy status every 10 minutes

/loop 30s check worker logs for errors
→ Check logs every 30 seconds

/loop /babysit-prs
→ Run /babysit-prs every 10 minutes (default)
```

## When to Use

- Polling deploy status after a push
- Monitoring logs for errors during testing
- Running quality checks on an interval
- Watching for external events (new leads, webhook activity)

## When NOT to Use

- One-off tasks (just run the command directly)
- Tasks that complete in a single run

## Protocol

1. Parse interval and command from user input
2. Execute command immediately (first run)
3. Wait for interval
4. Repeat until user stops (`Ctrl+C` or explicit stop request)
5. Report summary after each run

## Stopping

The loop runs until the user explicitly stops it or sends a new message.
