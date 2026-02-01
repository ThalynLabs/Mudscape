import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProfiles } from "@/hooks/use-profiles";
import { Profile } from "@shared/schema";
import { Wifi, Loader2 } from "lucide-react";

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProfile: (profile: Profile) => void;
  existingProfileIds: number[];
}

export function AddConnectionDialog({ open, onOpenChange, onSelectProfile, existingProfileIds }: AddConnectionDialogProps) {
  const { data: profiles, isLoading } = useProfiles();

  const availableProfiles = profiles?.filter(p => !existingProfileIds.includes(p.id)) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Connection</DialogTitle>
          <DialogDescription>
            Select a profile to open in a new tab.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : availableProfiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {profiles?.length === 0 
                ? "No profiles available. Create a profile first."
                : "All profiles are already connected."}
            </p>
          ) : (
            availableProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  onSelectProfile(profile);
                  onOpenChange(false);
                }}
                className="w-full p-3 rounded-lg border border-border text-left hover-elevate transition-colors"
                data-testid={`select-profile-${profile.id}`}
              >
                <div className="flex items-center gap-3">
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {profile.host}:{profile.port}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
