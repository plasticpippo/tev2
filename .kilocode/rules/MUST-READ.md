# Project Instructions

## Environment

- App: http://192.168.1.70 (LAN browser, not localhost)
- Admin credentials: `admin` / `admin123`
- PostgreSQL on port 5432 in Docker — see `.env` for credentials
- All servers (frontend, backend, db) run in Docker

Docker container names:
- `bar_pos_nginx`
- `bar_pos_frontend`
- `bar_pos_backend`
- `bar_pos_backend_db`

Rebuild and restart:
```bash
docker compose up -d --build
```

Before starting any container, verify it is not already running.

---

## General Behaviour

- No emojis anywhere in the frontend
- No workarounds or shortcuts — only proper solutions
- Do not rush; prioritise quality over speed
- Assign work to micro subagents to minimise token usage and make things more manageable
- All documentation goes in `./docs`
- Never kill all npm processes — only stop what the current task requires

---

## Concurrency and Rate Limits

This subscription has API rate limits. Parallel agents and parallel subagents will exhaust
them and cause the session to stall in a backoff loop.

- Execute all subtasks sequentially — finish one before starting the next
- Do NOT spawn parallel subagents or use parallel tool calls
- Do NOT use the Agent Manager to run concurrent sessions for a single feature
- One API request at a time; wait for a response before proceeding

---

## Think Before Coding

Before writing any code:

- State assumptions explicitly; ask if uncertain
- If multiple valid approaches exist, present them — do not pick silently
- If something is unclear, stop and ask
- Push back when a simpler approach exists

---

## Simplicity First

Write the minimum code that solves the problem:

- No unrequested features, abstractions, or configurability
- No speculative error handling
- If 200 lines could be 50, rewrite to 50
- Ask: "Would a senior engineer call this overcomplicated?" If yes, simplify

---

## Surgical Changes

Touch only what the task requires:

- Do not improve, reformat, or refactor adjacent code
- Match existing style even if you would do it differently
- If you notice unrelated dead code, mention it — do not delete it
- Remove imports, variables, and functions that your changes made unused
- Do not remove pre-existing dead code unless explicitly asked
- Every changed line must trace directly to the request

---

## Goal-Driven Execution

Turn tasks into verifiable goals before starting:

- "Add validation" → write tests for invalid inputs, then make them pass
- "Fix the bug" → reproduce it in a test, then make it pass

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Execute the plan; loop until all checks pass.

---

## Database Migrations

Always use Prisma migrations for schema changes — no exceptions.

Correct workflow:
```bash
cd backend
npx prisma migrate deploy
```

Use `migrate deploy` (not `migrate dev`) — the environment is headless and non-interactive.

Never use:
- `npx prisma db push` — forbidden, bypasses migration tracking
- Manual SQL changes — forbidden, not tracked

After every schema change:
1. Verify the migration file was created in `backend/prisma/migrations/`
2. Commit the migration file
3. Test with a fresh database: `docker compose down -v && docker compose up -d --build`

Why this matters: on startup, `docker-entrypoint.sh` runs `npx prisma migrate deploy`, which
only applies migration files. If a model exists in the schema but has no migration file, the
table will not exist on fresh installs.

See: `docs/troubleshooting-fresh-installation.md`

---

## Testing

- Use the Playwright MCP Server — do not install or use the `playwright` npm package
- Do not create test files — use the MCP server to browse the app directly
- All test-related files go in `./test-files`
- Run all tests as their own subtasks
- Test against http://192.168.1.70 (LAN)
