import { useProfiles, useDeleteProfile } from "@/hooks/use-profiles";
import { CreateProfileDialog } from "@/components/CreateProfileDialog";
import { useState, useEffect, useRef } from "react";
import { Profile } from "@shared/schema";
import { Loader2, TerminalSquare, Settings, MoreHorizontal, Pencil, Trash2, Play } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Home() {
  const { data: profiles, isLoading, error } = useProfiles();
  const deleteMutation = useDeleteProfile();
  const [, setLocation] = useLocation();
  const autoConnectChecked = useRef(false);
  
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Auto-connect to first profile with autoConnect enabled
  useEffect(() => {
    if (!isLoading && profiles && !autoConnectChecked.current) {
      autoConnectChecked.current = true;
      const autoConnectProfile = profiles.find(p => p.autoConnect);
      if (autoConnectProfile) {
        setLocation(`/play/${autoConnectProfile.id}`);
      }
    }
  }, [profiles, isLoading, setLocation]);

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
              Mudscape
            </motion.h1>
            <p className="text-muted-foreground text-lg">
              Accessible MUD Client
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/settings">
              <Button variant="outline" size="icon" data-testid="button-global-settings">
                <Settings className="w-5 h-5" />
                <span className="sr-only">Global Settings</span>
              </Button>
            </Link>
            <Button 
              onClick={() => { setEditingProfile(null); setDialogOpen(true); }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              data-testid="button-new-connection"
            >
              <TerminalSquare className="mr-2 w-4 h-4" />
              New Connection
            </Button>
            <CreateProfileDialog 
              open={dialogOpen} 
              onOpenChange={handleCreateOpen} 
              existingProfile={editingProfile}
            />
          </div>
        </header>

        {/* Profiles Table */}
        {profiles && profiles.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border rounded-lg overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Host</TableHead>
                  <TableHead className="font-semibold w-20">Port</TableHead>
                  <TableHead className="font-semibold w-32 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id} className="hover-elevate" data-testid={`row-profile-${profile.id}`}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {profile.description || <span className="italic">No description</span>}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{profile.host}</TableCell>
                    <TableCell className="font-mono text-sm">{profile.port}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/play/${profile.id}`}>
                          <Button size="sm" data-testid={`button-connect-${profile.id}`}>
                            <Play className="w-3 h-3 mr-1" />
                            Connect
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-options-${profile.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                              <span className="sr-only">Options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(profile)} data-testid={`menu-edit-${profile.id}`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(profile.id)} 
                              className="text-destructive focus:text-destructive"
                              data-testid={`menu-delete-${profile.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-xl">No connections configured.</p>
            <p className="text-sm text-muted-foreground mt-2">Create a new connection to start playing.</p>
          </div>
        )}
      </div>
    </div>
  );
}
