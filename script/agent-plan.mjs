import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const now = new Date().toISOString();

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

const branch = run("git rev-parse --abbrev-ref HEAD");
const status = run("git status --short || true");
const changedFiles = status
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.replace(/^\S+\s+/, ""));

const content = `# Agent Plan\n\nGenerated: ${now}\nBranch: ${branch}\n\n## Scope\n- Describe the feature or bugfix in 1-2 lines.\n\n## Proposed Steps\n- [ ] Step 1\n- [ ] Step 2\n- [ ] Step 3\n\n## Validation\n- [ ] npm run check\n- [ ] npm run build\n\n## Changed Files At Plan Time\n${changedFiles.length ? changedFiles.map((file) => `- ${file}`).join("\n") : "- (none)"}\n\n## Notes\n- Risks:\n- Rollback plan:\n`;

mkdirSync(join(process.cwd(), ".agent"), { recursive: true });
const outputPath = join(process.cwd(), ".agent", "PLAN.md");
writeFileSync(outputPath, content, "utf8");

console.log(`Wrote ${outputPath}`);
