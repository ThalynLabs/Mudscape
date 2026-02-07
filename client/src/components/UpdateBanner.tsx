import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { ArrowUpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  lastChecked: number | null;
  error: string | null;
}

export function UpdateBanner() {
  const { isAuthenticated, user, accountMode } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const isAdminOrSingle = accountMode === "single" || user?.isAdmin;

  const { data: updateInfo } = useQuery<UpdateInfo>({
    queryKey: ["/api/update-check"],
    enabled: isAuthenticated && isAdminOrSingle === true,
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 60,
  });

  if (dismissed || !updateInfo?.updateAvailable) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-between gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20"
      role="alert"
      data-testid="banner-update-available"
    >
      <div className="flex items-center gap-2 text-sm">
        <ArrowUpCircle className="h-4 w-4 shrink-0" />
        <span>
          Mudscape <strong>v{updateInfo.latestVersion}</strong> is available
          (you have v{updateInfo.currentVersion}).
          Update via your setup script or <code className="text-xs bg-muted px-1 py-0.5 rounded">git pull</code>.
        </span>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss update notification"
        data-testid="button-dismiss-update"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
