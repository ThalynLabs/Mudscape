import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles } from "@/hooks/use-profiles";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Search, Package, Download, ArrowLeft, Loader2, Trash2, Zap, Terminal, Keyboard, Timer, MousePointer, Layers } from "lucide-react";
import type { Package as PackageType, PackageContents, Profile } from "@shared/schema";

function getItemsSummary(pkg: PackageType): string {
  const contents = (pkg.contents || {}) as PackageContents;
  const parts: string[] = [];
  if (contents.triggers?.length) parts.push(`${contents.triggers.length} triggers`);
  if (contents.aliases?.length) parts.push(`${contents.aliases.length} aliases`);
  if (contents.timers?.length) parts.push(`${contents.timers.length} timers`);
  if (contents.keybindings?.length) parts.push(`${contents.keybindings.length} keybindings`);
  if (contents.buttons?.length) parts.push(`${contents.buttons.length} buttons`);
  if (contents.scripts?.length) parts.push(`${contents.scripts.length} scripts`);
  if (contents.classes?.length) parts.push(`${contents.classes.length} classes`);
  return parts.join(", ") || "Empty";
}

function getContentIcons(pkg: PackageType) {
  const contents = (pkg.contents || {}) as PackageContents;
  const icons: { icon: typeof Zap; label: string; count: number }[] = [];
  if (contents.triggers?.length) icons.push({ icon: Zap, label: "Triggers", count: contents.triggers.length });
  if (contents.aliases?.length) icons.push({ icon: Terminal, label: "Aliases", count: contents.aliases.length });
  if (contents.timers?.length) icons.push({ icon: Timer, label: "Timers", count: contents.timers.length });
  if (contents.keybindings?.length) icons.push({ icon: Keyboard, label: "Keybindings", count: contents.keybindings.length });
  if (contents.buttons?.length) icons.push({ icon: MousePointer, label: "Buttons", count: contents.buttons.length });
  if (contents.classes?.length) icons.push({ icon: Layers, label: "Classes", count: contents.classes.length });
  return icons;
}

export default function PackageRepo() {
  const { user } = useAuth();
  const { data: profiles = [] } = useProfiles();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [installDialogPkg, setInstallDialogPkg] = useState<PackageType | null>(null);

  const searchUrl = search ? `/api/shared-packages?search=${encodeURIComponent(search)}` : "/api/shared-packages";
  const { data: sharedPackages = [], isLoading } = useQuery<PackageType[]>({
    queryKey: ["/api/shared-packages", search],
    queryFn: async () => {
      const res = await apiRequest("GET", searchUrl);
      return res.json();
    },
  });

  const installMutation = useMutation({
    mutationFn: async ({ packageId, profileId }: { packageId: number; profileId: number }) => {
      const res = await apiRequest("POST", `/api/shared-packages/${packageId}/install`, { profileId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared-packages"], exact: false });
      setInstallDialogPkg(null);
      toast({ title: "Package installed", description: "The package has been added to your profile" });
    },
    onError: (err: Error) => {
      toast({ title: "Install failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/shared-packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-packages"], exact: false });
      toast({ title: "Package removed from repository" });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const handleInstall = (profileId: number) => {
    if (!installDialogPkg) return;
    installMutation.mutate({ packageId: installDialogPkg.id, profileId });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="w-5 h-5" />
                <span className="sr-only">Back to Home</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
                <Package className="w-7 h-7" />
                Package Repository
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Browse and install shared packages from other users on this server
              </p>
            </div>
          </div>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, MUD, or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-packages"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : sharedPackages.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-1" data-testid="text-empty-state">
                {search ? "No matching packages found" : "No shared packages yet"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try different search terms"
                  : "Share your packages from the Package Manager to see them here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedPackages.map((pkg) => (
              <Card key={pkg.id} className="flex flex-col" data-testid={`card-package-${pkg.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate" data-testid={`text-package-name-${pkg.id}`}>
                        {pkg.name}
                      </CardTitle>
                      {pkg.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {pkg.description}
                        </CardDescription>
                      )}
                    </div>
                    {user?.isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(pkg.id)}
                        title="Remove from repository"
                        data-testid={`button-admin-delete-${pkg.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {pkg.targetMud && (
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-mud-${pkg.id}`}>
                          {pkg.targetMud}
                        </Badge>
                      )}
                      {pkg.version && (
                        <Badge variant="outline" className="text-xs">
                          v{pkg.version}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {getContentIcons(pkg).map(({ icon: Icon, label, count }) => (
                        <div key={label} className="flex items-center gap-1 text-xs text-muted-foreground" title={`${count} ${label}`}>
                          <Icon className="w-3 h-3" />
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {pkg.author && <span>by {pkg.author}</span>}
                      {(pkg.downloads ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {pkg.downloads}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setInstallDialogPkg(pkg)}
                    className="w-full"
                    data-testid={`button-use-pack-${pkg.id}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Use This Pack
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!installDialogPkg} onOpenChange={(open) => !open && setInstallDialogPkg(null)}>
        <DialogContent className="sm:max-w-md" aria-describedby="install-dialog-desc" data-testid="dialog-install-package">
          <DialogHeader>
            <DialogTitle data-testid="text-install-dialog-title">
              Install "{installDialogPkg?.name}"
            </DialogTitle>
          </DialogHeader>
          <p id="install-dialog-desc" className="text-sm text-muted-foreground">
            Choose which profile to install this package into. The contents will be merged with your existing automation.
          </p>
          <div className="text-xs text-muted-foreground mb-2">
            {installDialogPkg && getItemsSummary(installDialogPkg)}
          </div>
          {profiles.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">You need a profile to install packages into.</p>
              <Link href="/">
                <Button size="sm" data-testid="button-create-profile-first">Create a Profile</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {profiles.map((profile: Profile) => (
                <Button
                  key={profile.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleInstall(profile.id)}
                  disabled={installMutation.isPending}
                  data-testid={`button-install-to-profile-${profile.id}`}
                >
                  {installMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Terminal className="w-4 h-4" />
                  )}
                  <span className="truncate">{profile.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{profile.host}:{profile.port}</span>
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
