import { useProfiles, useDeleteProfile, useCreateProfile } from "@/hooks/use-profiles";
import { CreateProfileDialog } from "@/components/CreateProfileDialog";
import { useState, useEffect, useRef } from "react";
import { Profile, InsertProfile } from "@shared/schema";
import { Loader2, TerminalSquare, Settings, MoreHorizontal, Pencil, Trash2, Play, Download, Upload, HelpCircle, Keyboard, Volume2, Zap, LogIn, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UpdateBanner } from "@/components/UpdateBanner";

export default function Home() {
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const { data: profiles, isLoading: profilesLoading, error } = useProfiles();
  const deleteMutation = useDeleteProfile();
  const createMutation = useCreateProfile();
  const [, setLocation] = useLocation();
  const autoConnectChecked = useRef(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const isLoading = authLoading || (isAuthenticated && profilesLoading);

  // Auto-connect to first profile with autoConnect enabled
  useEffect(() => {
    if (!isLoading && profiles && isAuthenticated && !autoConnectChecked.current) {
      autoConnectChecked.current = true;
      const autoConnectProfile = profiles.find(p => p.autoConnect);
      if (autoConnectProfile) {
        setLocation(`/play/${autoConnectProfile.id}`);
      }
    }
  }, [profiles, isLoading, isAuthenticated, setLocation]);

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

  const handleExportProfile = (profile: Profile) => {
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      profile: {
        name: profile.name,
        description: profile.description,
        host: profile.host,
        port: profile.port,
        encoding: profile.encoding,
        autoConnect: profile.autoConnect,
        characterName: profile.characterName,
        characterPassword: profile.characterPassword,
        loginCommands: profile.loginCommands,
        settings: profile.settings,
        triggers: profile.triggers,
        aliases: profile.aliases,
        scripts: profile.scripts,
        timers: profile.timers,
        keybindings: profile.keybindings,
        buttons: profile.buttons,
        classes: profile.classes,
        variables: profile.variables,
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name.toLowerCase().replace(/\s+/g, '-')}-profile.mudscape.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Profile exported", description: `${profile.name} saved to file` });
  };

  const handleImportProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!data.profile || !data.profile.name || !data.profile.host || !data.profile.port) {
          throw new Error('Invalid profile format: missing required fields');
        }

        if (typeof data.profile.port !== 'number' || data.profile.port < 1 || data.profile.port > 65535) {
          throw new Error('Invalid port number');
        }

        const profileData: InsertProfile = {
          name: (data.profile.name || 'Unnamed').trim() + " (Imported)",
          description: typeof data.profile.description === 'string' ? data.profile.description : null,
          host: String(data.profile.host).trim(),
          port: Number(data.profile.port),
          encoding: typeof data.profile.encoding === 'string' ? data.profile.encoding : "ISO-8859-1",
          autoConnect: false,
          characterName: typeof data.profile.characterName === 'string' ? data.profile.characterName : null,
          characterPassword: typeof data.profile.characterPassword === 'string' ? data.profile.characterPassword : null,
          loginCommands: typeof data.profile.loginCommands === 'string' ? data.profile.loginCommands : null,
          settings: data.profile.settings && typeof data.profile.settings === 'object' ? data.profile.settings : {},
          triggers: Array.isArray(data.profile.triggers) ? data.profile.triggers : [],
          aliases: Array.isArray(data.profile.aliases) ? data.profile.aliases : [],
          scripts: Array.isArray(data.profile.scripts) ? data.profile.scripts : [],
          timers: Array.isArray(data.profile.timers) ? data.profile.timers : [],
          keybindings: Array.isArray(data.profile.keybindings) ? data.profile.keybindings : [],
          buttons: Array.isArray(data.profile.buttons) ? data.profile.buttons : [],
          classes: Array.isArray(data.profile.classes) ? data.profile.classes : [],
          variables: data.profile.variables && typeof data.profile.variables === 'object' ? data.profile.variables : {},
        };

        try {
          await createMutation.mutateAsync(profileData);
          toast({ title: "Profile imported", description: `${data.profile.name} has been imported` });
        } catch (createErr) {
          toast({ 
            title: "Import failed", 
            description: "Could not save profile to database. The data may be corrupted.",
            variant: "destructive" 
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid file format";
        toast({ 
          title: "Import failed", 
          description: message,
          variant: "destructive" 
        });
      }
    };
    reader.readAsText(file);

    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (error && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-destructive">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">System Error</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  // Landing page for logged out users
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-mono">
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-16">
          {/* Landing Header */}
          <header className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <TerminalSquare className="w-10 h-10 text-primary" />
              <span className="text-2xl font-bold text-primary">Mudscape</span>
            </div>
            <div className="flex gap-3">
              <Link href="/help">
                <Button variant="ghost" data-testid="button-help">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help
                </Button>
              </Link>
              <a href="/api/login">
                <Button data-testid="button-login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In
                </Button>
              </a>
            </div>
          </header>

          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 py-12"
          >
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              Accessible <span className="text-primary">MUD Client</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Play text-based adventures with full screen reader support. 
              VoiceOver, NVDA, and Orca compatible.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <a href="/api/login">
                <Button size="lg" className="shadow-lg shadow-primary/20" data-testid="button-get-started">
                  <LogIn className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </a>
              <Link href="/help">
                <Button size="lg" variant="outline" data-testid="button-learn-more">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.section>

          {/* Features Grid */}
          <section className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-primary" />
                  Screen Reader First
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Built from the ground up for accessibility. Text-to-speech, keyboard navigation, and ARIA support throughout.
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Lua Scripting
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Powerful automation with triggers, aliases, timers, and keybindings. Compatible with Mudlet scripts.
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary" />
                  Keyboard Focused
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Navigate with F1 for help, Ctrl+1-9 to read lines, and customizable keybindings for any action.
              </CardContent>
            </Card>
          </section>

          {/* Self-hosting CTA */}
          <section className="text-center border border-border rounded-lg p-8 bg-muted/30">
            <h2 className="text-2xl font-bold mb-2">Self-Host Mudscape</h2>
            <p className="text-muted-foreground mb-4">
              Want to run your own instance? Our install wizard walks you through setup step by step.
            </p>
            <Link href="/install">
              <Button variant="outline" data-testid="button-self-host">
                Self-Hosting Guide
              </Button>
            </Link>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-primary-foreground">
      <UpdateBanner />
      <div className="max-w-6xl mx-auto space-y-12 p-6 md:p-12">
        
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
              {user ? `Welcome back, ${user.username}` : 'Accessible MUD Client'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              ref={importInputRef}
              type="file"
              accept=".json,.mudscape.json"
              className="hidden"
              onChange={handleImportProfile}
              aria-label="Import profile file"
            />
            <Button 
              variant="outline" 
              onClick={() => importInputRef.current?.click()}
              data-testid="button-import-profile"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Profile
            </Button>
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
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-user-menu">
                  <User className="w-5 h-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user?.username}
                  {user?.isAdmin && <span className="ml-1 text-xs text-primary">(Admin)</span>}
                </div>
                <DropdownMenuSeparator />
                {user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer" data-testid="menu-admin">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer" data-testid="menu-logout">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
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
                            <DropdownMenuItem onClick={() => handleExportProfile(profile)} data-testid={`menu-export-${profile.id}`}>
                              <Download className="w-4 h-4 mr-2" />
                              Export Backup
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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

        {/* Getting Started Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold border-b border-border pb-4">Getting Started</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover-elevate">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TerminalSquare className="w-5 h-5 text-primary" />
                  Quick Start
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. Click "New Connection" to add a MUD</p>
                <p>2. Enter host address and port</p>
                <p>3. Click "Connect" to start playing</p>
                <p>4. Type commands and press Enter</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Keyboard className="w-5 h-5 text-primary" />
                  Key Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><kbd className="bg-muted px-1 rounded">F1</kbd> Open help wiki</p>
                <p><kbd className="bg-muted px-1 rounded">Ctrl+1-9</kbd> Read recent lines</p>
                <p><kbd className="bg-muted px-1 rounded">Ctrl Ctrl</kbd> Pause speech</p>
                <p><kbd className="bg-muted px-1 rounded">Escape</kbd> Clear input</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Volume2 className="w-5 h-5 text-primary" />
                  Speech Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Text-to-speech is on by default</p>
                <p>Type <code className="bg-muted px-1 rounded">/config speech off</code> to disable</p>
                <p>Adjust rate, volume, pitch in Settings</p>
                <p>Works with VoiceOver, NVDA, Orca</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-primary" />
                  Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Triggers</strong> - React to MUD text</p>
                <p><strong>Aliases</strong> - Command shortcuts</p>
                <p><strong>Timers</strong> - Scheduled actions</p>
                <p>All support Lua scripting</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Commands
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><code className="bg-muted px-1 rounded">/help</code> Quick reference</p>
                <p><code className="bg-muted px-1 rounded">/config</code> Change settings</p>
                <p><code className="bg-muted px-1 rounded">/connect</code> Reconnect</p>
                <p><code className="bg-muted px-1 rounded">/disconnect</code> Disconnect</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Learn More
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Full documentation with tutorials and examples.
                </p>
                <Link href="/help">
                  <Button variant="outline" className="w-full" data-testid="button-open-help">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Open Help Wiki
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
