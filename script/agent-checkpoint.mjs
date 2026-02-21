import { execSync } from "node:child_process";

const rawMessage = process.argv.slice(2).join(" ").trim();
const checkpointMessage = rawMessage || "checkpoint";

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

const status = run("git status --porcelain || true");
if (!status) {
  console.log("No changes to checkpoint.");
  process.exit(0);
}

run("git add -A");
const branch = run("git rev-parse --abbrev-ref HEAD");
const timestamp = new Date().toISOString().replace("T", " ").replace("Z", " UTC");
const finalMessage = `[agent-checkpoint][${branch}] ${checkpointMessage} (${timestamp})`;

execSync(`git commit -m ${JSON.stringify(finalMessage)}`, { stdio: "inherit" });
console.log(`Created checkpoint commit: ${finalMessage}`);
