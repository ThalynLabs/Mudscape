import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, Download, RefreshCw, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  lastChecked: number | null;
  error: string | null;
}

interface InstallProgress {
  status: "idle" | "pulling" | "installing" | "migrating" | "complete" | "error";
  message: string;
  details?: string;
}

interface InstallResult {
  steps: InstallProgress[];
  result: InstallProgress;
}

export function UpdateDialog() {
  const { isAuthenticated, user, accountMode } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  const isAdminOrSingle = accountMode === "single" || user?.isAdmin;

  const { data: updateInfo } = useQuery<UpdateInfo>({
    queryKey: ["/api/update-check"],
    enabled: isAuthenticated && isAdminOrSingle === true,
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (updateInfo?.updateAvailable && !dismissed) {
      setOpen(true);
    }
  }, [updateInfo?.updateAvailable, dismissed]);

  if (!isAdminOrSingle) {
    return null;
  }

  const installMutation = useMutation<InstallResult>({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/update-install");
      return res.json();
    },
  });

  const restartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/restart");
      return res.json();
    },
  });

  const handleDismiss = () => {
    setDismissed(true);
    setOpen(false);
  };

  const handleInstall = () => {
    installMutation.mutate();
  };

  const handleRestart = () => {
    restartMutation.mutate();
  };

  if (!updateInfo?.updateAvailable || dismissed) {
    return null;
  }

  const isInstalling = installMutation.isPending;
  const installDone = installMutation.data?.result?.status === "complete";
  const installError = installMutation.data?.result?.status === "error" || installMutation.isError;
  const isRestarting = restartMutation.isPending || restartMutation.isSuccess;

  const getStatusIcon = (step: InstallProgress) => {
    switch (step.status) {
      case "pulling":
        return <Download className="h-4 w-4 text-muted-foreground shrink-0" />;
      case "installing":
        return <Download className="h-4 w-4 text-muted-foreground shrink-0" />;
      case "migrating":
        return <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />;
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin shrink-0" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleDismiss(); }}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="update-dialog-description"
        data-testid="dialog-update"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-update-title">
            <ArrowUpCircle className="h-5 w-5" />
            Update Available
          </DialogTitle>
        </DialogHeader>

        <div id="update-dialog-description" className="space-y-4">
          {!installMutation.data && !isInstalling && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground" data-testid="text-update-description">
                Mudscape <strong>v{updateInfo.latestVersion}</strong> is available.
                You are currently running <strong>v{updateInfo.currentVersion}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                The update will pull the latest code, install dependencies, and run any
                database changes automatically.
              </p>
            </div>
          )}

          {isInstalling && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-update-progress">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Installing update... This may take a minute.</span>
            </div>
          )}

          {installMutation.data && (
            <div className="space-y-2" data-testid="text-update-steps">
              {installMutation.data.steps
                .filter((s, i, arr) => {
                  const next = arr[i + 1];
                  return !next || next.status !== s.status;
                })
                .map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {getStatusIcon(step)}
                    <span className={step.status === "error" ? "text-destructive" : "text-muted-foreground"}>
                      {step.message}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {installError && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3" data-testid="text-update-error">
              {installMutation.data?.result?.details || installMutation.error?.message || "An error occurred during update."}
            </div>
          )}

          {isRestarting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-restart-progress">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Restarting server... The page will reload momentarily.</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {!installDone && !isInstalling && !isRestarting && (
            <>
              <Button
                variant="outline"
                onClick={handleDismiss}
                data-testid="button-update-cancel"
              >
                Not Now
              </Button>
              <Button
                onClick={handleInstall}
                disabled={installError === true && !installMutation.data}
                data-testid="button-update-install"
              >
                <Download className="h-4 w-4 mr-2" />
                Install Update
              </Button>
            </>
          )}

          {installDone && !isRestarting && (
            <Button
              onClick={handleRestart}
              data-testid="button-update-restart"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart Now
            </Button>
          )}

          {installError && !isInstalling && (
            <Button
              variant="outline"
              onClick={handleDismiss}
              data-testid="button-update-dismiss-error"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
