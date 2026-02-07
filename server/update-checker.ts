import { readFileSync } from "fs";
import { join } from "path";

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
