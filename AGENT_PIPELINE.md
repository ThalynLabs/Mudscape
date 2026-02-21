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

## Promote to main safely (keep pipeline dev-only)

Use this flow when shipping features so dev-only pipeline files do not reach `main`:

1. Start from `main` and create a clean release branch:
  - `git switch main`
  - `git pull`
  - `git switch -c release/<feature-name>`
2. Cherry-pick only feature commits from `development`:
  - `git log --oneline development`
  - `git cherry-pick <feature-commit-sha>`
3. Verify no dev-only files are included:
  - `git diff --name-only origin/main...HEAD`
  - Ensure this list excludes:
    - `.agent/`
    - `.vscode/tasks.json`
    - `.vscode/settings.json`
    - `.vscode/extensions.json`
    - `AGENT_PIPELINE.md`
    - `script/agent-plan.mjs`
    - `script/agent-checkpoint.mjs`
4. Run validation before merge:
  - `npm run check`
  - `npm run build`
5. Open PR from `release/<feature-name>` to `main`.

Note: A local `.git/hooks/pre-push` guard blocks pushes to `main` when these dev-only files are present.
