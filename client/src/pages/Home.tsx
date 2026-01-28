import { useProfiles, useDeleteProfile } from "@/hooks/use-profiles";
import { CreateProfileDialog } from "@/components/CreateProfileDialog";
import { ProfileCard } from "@/components/ProfileCard";
import { useState } from "react";
import { Profile } from "@shared/schema";
import { Loader2, TerminalSquare, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  const { data: profiles, isLoading, error } = useProfiles();
  const deleteMutation = useDeleteProfile();
  
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this profile?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleCreateOpen = (open: boolean) => {
    if (!open) setEditingProfile(null);
    setDialogOpen(open);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-destructive">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">System Error</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-mono selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary flex items-center gap-3"
            >
              <TerminalSquare className="w-10 h-10 md:w-12 md:h-12" />
              MUD.CLIENT
            </motion.h1>
            <p className="text-muted-foreground text-lg">
              Secure WebSocket Relay Terminal v1.0
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/settings">
              <Button variant="outline" size="icon" data-testid="button-global-settings">
                <Settings className="w-5 h-5" />
                <span className="sr-only">Global Settings</span>
              </Button>
            </Link>
            <CreateProfileDialog 
              open={dialogOpen} 
              onOpenChange={handleCreateOpen} 
              existingProfile={editingProfile}
            />
          </div>
        </header>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles?.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <ProfileCard 
                profile={profile} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
          
          {profiles?.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl">
              <p className="text-muted-foreground text-xl">No connections configured.</p>
              <p className="text-sm text-muted-foreground mt-2">Create a new connection to start playing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
