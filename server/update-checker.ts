import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";

const REPO_OWNER = "ThalynLabs";
const REPO_NAME = "Mudscape";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  lastChecked: number | null;
  error: string | null;
}

let updateInfo: UpdateInfo = {
  currentVersion: getLocalVersion(),
  latestVersion: null,
  updateAvailable: false,
  lastChecked: null,
  error: null,
};

let checkTimer: ReturnType<typeof setInterval> | null = null;
let started = false;

function getLocalVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf-8")
    );
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function compareVersions(local: string, remote: string): boolean {
  const localParts = local.split(".").map(Number);
  const remoteParts = remote.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const l = localParts[i] || 0;
    const r = remoteParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/package.json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const pkg = await res.json();
    return pkg.version || null;
  } catch {
    return null;
  }
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  const latestVersion = await fetchLatestVersion();

  updateInfo.currentVersion = getLocalVersion();
  updateInfo.lastChecked = Date.now();

  if (latestVersion) {
    updateInfo.latestVersion = latestVersion;
    updateInfo.updateAvailable = compareVersions(
      updateInfo.currentVersion,
      latestVersion
    );
    updateInfo.error = null;
  } else {
    updateInfo.error = "Could not reach update server";
  }

  if (updateInfo.updateAvailable) {
    console.log(
      `Update available: v${updateInfo.currentVersion} → v${updateInfo.latestVersion}`
    );
  }

  return updateInfo;
}

export function getUpdateInfo(): UpdateInfo {
  return { ...updateInfo };
}

export function startUpdateChecker(): void {
  if (started) return;
  started = true;

  checkForUpdates().catch(() => {});

  checkTimer = setInterval(() => {
    checkForUpdates().catch(() => {});
  }, CHECK_INTERVAL_MS);
}

export function stopUpdateChecker(): void {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}

export interface InstallProgress {
  status: "idle" | "pulling" | "installing" | "migrating" | "complete" | "error";
  message: string;
  details?: string;
}

let installInProgress = false;

function runCommand(cmd: string, args: string[], cwd: string, timeoutMs: number): Promise<{ code: number; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Command timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    child.stdout.on("data", (d: Buffer) => { output += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { output += d.toString(); });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, output });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function installUpdate(onProgress: (progress: InstallProgress) => void): Promise<InstallProgress> {
  if (installInProgress) {
    const p: InstallProgress = { status: "error", message: "An update is already in progress" };
    onProgress(p);
    return p;
  }

  const cwd = process.cwd();

  if (!existsSync(join(cwd, ".git"))) {
    const p: InstallProgress = { status: "error", message: "Not a git repository. Update must be done manually." };
    onProgress(p);
    return p;
  }

  installInProgress = true;

  try {
    onProgress({ status: "pulling", message: "Pulling latest code from GitHub..." });
    const pull = await runCommand("git", ["pull", "--ff-only"], cwd, 60000);
    if (pull.code !== 0) throw new Error(`git pull failed: ${pull.output.slice(-500)}`);
    onProgress({ status: "pulling", message: "Code updated", details: pull.output.trim().slice(-500) });

    onProgress({ status: "installing", message: "Installing dependencies..." });
    const inst = await runCommand("npm", ["install", "--production"], cwd, 120000);
    if (inst.code !== 0) throw new Error(`npm install failed: ${inst.output.slice(-500)}`);
    onProgress({ status: "installing", message: "Dependencies installed", details: inst.output.slice(-500) });

    onProgress({ status: "migrating", message: "Running database migrations..." });
    try {
      const migrate = await runCommand("npm", ["run", "db:push"], cwd, 60000);
      onProgress({ status: "migrating", message: "Migrations complete", details: migrate.output.slice(-500) });
    } catch {
      onProgress({ status: "migrating", message: "Migration warning (may not be needed)" });
    }

    updateInfo.updateAvailable = false;
    updateInfo.currentVersion = getLocalVersion();

    const result: InstallProgress = { status: "complete", message: "Update installed successfully. Restart to apply changes." };
    onProgress(result);
    installInProgress = false;
    return result;
  } catch (err: any) {
    installInProgress = false;
    const result: InstallProgress = {
      status: "error",
      message: "Update failed",
      details: err.message || String(err),
    };
    onProgress(result);
    return result;
  }
}
