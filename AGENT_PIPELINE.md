# VS Code Agentic Pipeline (Replit-style)

This project now includes a lightweight agentic workflow in VS Code to mimic Replit Agent’s pipeline:

1. Plan
2. Build/Validate
3. Checkpoint
4. Rollback (via Git)

## Run from VS Code

Open the command palette and run **Tasks: Run Task**:

- `Agent Pipeline: Plan`
- `Agent Pipeline: Validate`
- `Agent Pipeline: Checkpoint`
- `Agent Pipeline: Plan + Validate`

## What each step does

### Plan
- Runs `npm run agent:plan`
- Generates `.agent/PLAN.md` with:
  - timestamp
  - current branch
  - changed files snapshot
  - checklist sections for scope, steps, validation, and risks

### Validate
- Runs `npm run agent:validate`
- Executes:
  - `npm run check`
  - `npm run build`

This is your quality gate before checkpointing.

### Checkpoint
- Runs `npm run agent:checkpoint -- "<message>"`
- Creates a Git checkpoint commit containing all current changes.
- Commit format:
  - `[agent-checkpoint][<branch>] <message> (<utc timestamp>)`

## Rollback (Replit checkpoint equivalent)

- See history: `git log --oneline --decorate -n 20`
- Roll back to a checkpoint: `git reset --hard <commit>`
- Or move around safely with `git switch -c experiment/<name>` before trying alternatives.

## Suggested daily loop

1. `Agent Pipeline: Plan`
2. Implement with Copilot
3. `Agent Pipeline: Validate`
4. `Agent Pipeline: Checkpoint`
5. Repeat in small increments

This gives you a practical Replit-like autonomous loop in VS Code with explicit control and full Git recoverability.
