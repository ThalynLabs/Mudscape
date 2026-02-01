import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Package, Upload, Download, Trash2, FolderOpen, Plus, FileJson } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Profile, Package as PackageType, PackageContents } from "@shared/schema";

interface PackageManagerProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PackageManager({ profile, open, onOpenChange }: PackageManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportName, setExportName] = useState('');
  const [exportDescription, setExportDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<{
    triggers: boolean;
    aliases: boolean;
    timers: boolean;
    keybindings: boolean;
    buttons: boolean;
    classes: boolean;
  }>({
    triggers: true,
    aliases: true,
    timers: true,
    keybindings: true,
    buttons: true,
    classes: true,
  });

  const { data: packages = [] } = useQuery<PackageType[]>({
    queryKey: ['/api/packages'],
  });

  const createPackageMutation = useMutation({
    mutationFn: (pkg: Omit<PackageType, 'id'>) => 
      apiRequest('POST', '/api/packages', pkg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({ title: "Package saved" });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/packages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({ title: "Package deleted" });
    },
  });

  const installPackageMutation = useMutation({
    mutationFn: async (pkg: PackageType) => {
      const contents = pkg.contents as PackageContents;
      const updates: Partial<Profile> = {};
      
      if (contents.triggers?.length) {
        updates.triggers = [...(profile.triggers || []), ...contents.triggers];
      }
      if (contents.aliases?.length) {
        updates.aliases = [...(profile.aliases || []), ...contents.aliases];
      }
      if (contents.timers?.length) {
        updates.timers = [...(profile.timers || []), ...contents.timers];
      }
      if (contents.keybindings?.length) {
        updates.keybindings = [...(profile.keybindings || []), ...contents.keybindings];
      }
      if (contents.buttons?.length) {
        updates.buttons = [...(profile.buttons || []), ...contents.buttons];
      }
      if (contents.classes?.length) {
        updates.classes = [...(profile.classes || []), ...contents.classes];
      }
      
      return apiRequest('PUT', `/api/profiles/${profile.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({ title: "Package installed to profile" });
    },
  });

  const handleExport = () => {
    if (!exportName.trim()) {
      toast({ title: "Please enter a package name", variant: "destructive" });
      return;
    }

    const contents: PackageContents = {};
    
    if (selectedItems.triggers && profile.triggers?.length) {
      contents.triggers = profile.triggers as any;
    }
    if (selectedItems.aliases && profile.aliases?.length) {
      contents.aliases = profile.aliases as any;
    }
    if (selectedItems.timers && profile.timers?.length) {
      contents.timers = profile.timers as any;
    }
    if (selectedItems.keybindings && profile.keybindings?.length) {
      contents.keybindings = profile.keybindings as any;
    }
    if (selectedItems.buttons && profile.buttons?.length) {
      contents.buttons = profile.buttons as any;
    }
    if (selectedItems.classes && profile.classes?.length) {
      contents.classes = profile.classes as any;
    }

    const pkg = {
      name: exportName,
      description: exportDescription,
      version: "1.0.0",
      author: "",
      contents,
    };

    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportName.toLowerCase().replace(/\s+/g, '-')}.mudpack.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportDialogOpen(false);
    setExportName('');
    setExportDescription('');
    toast({ title: "Package exported" });
  };

  const handleSaveToLibrary = () => {
    if (!exportName.trim()) {
      toast({ title: "Please enter a package name", variant: "destructive" });
      return;
    }

    const contents: PackageContents = {};
    
    if (selectedItems.triggers && profile.triggers?.length) {
      contents.triggers = profile.triggers as any;
    }
    if (selectedItems.aliases && profile.aliases?.length) {
      contents.aliases = profile.aliases as any;
    }
    if (selectedItems.timers && profile.timers?.length) {
      contents.timers = profile.timers as any;
    }
    if (selectedItems.keybindings && profile.keybindings?.length) {
      contents.keybindings = profile.keybindings as any;
    }
    if (selectedItems.buttons && profile.buttons?.length) {
      contents.buttons = profile.buttons as any;
    }
    if (selectedItems.classes && profile.classes?.length) {
      contents.classes = profile.classes as any;
    }

    createPackageMutation.mutate({
      name: exportName,
      description: exportDescription,
      version: "1.0.0",
      author: "",
      contents,
    });

    setExportDialogOpen(false);
    setExportName('');
    setExportDescription('');
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const pkg = JSON.parse(e.target?.result as string);
        if (!pkg.name || !pkg.contents) {
          throw new Error('Invalid package format');
        }
        
        createPackageMutation.mutate({
          name: pkg.name,
          description: pkg.description || '',
          version: pkg.version || '1.0.0',
          author: pkg.author || '',
          contents: pkg.contents,
        });
      } catch (err) {
        toast({ 
          title: "Import failed", 
          description: "Invalid package file format",
          variant: "destructive" 
        });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const countItems = (pkg: PackageType) => {
    const contents = pkg.contents as PackageContents;
    let count = 0;
    count += contents.triggers?.length || 0;
    count += contents.aliases?.length || 0;
    count += contents.timers?.length || 0;
    count += contents.keybindings?.length || 0;
    count += contents.buttons?.length || 0;
    count += contents.classes?.length || 0;
    return count;
  };

  const getItemsSummary = (pkg: PackageType) => {
    const contents = pkg.contents as PackageContents;
    const parts: string[] = [];
    if (contents.triggers?.length) parts.push(`${contents.triggers.length} triggers`);
    if (contents.aliases?.length) parts.push(`${contents.aliases.length} aliases`);
    if (contents.timers?.length) parts.push(`${contents.timers.length} timers`);
    if (contents.keybindings?.length) parts.push(`${contents.keybindings.length} keybindings`);
    if (contents.buttons?.length) parts.push(`${contents.buttons.length} buttons`);
    if (contents.classes?.length) parts.push(`${contents.classes.length} classes`);
    return parts.join(', ') || 'Empty';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] border-l border-border bg-card overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <Package className="w-5 h-5" />
            Package Manager
          </SheetTitle>
          <SheetDescription>
            Import, export, and manage automation packages.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          <Tabs defaultValue="library">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library" data-testid="tab-library">Library</TabsTrigger>
              <TabsTrigger value="export" data-testid="tab-export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                  data-testid="button-import-package"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import from File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.mudpack.json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>

              {packages.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No packages in library</p>
                    <p className="text-sm">Import a package or export from your profile</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <Card key={pkg.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{pkg.name}</CardTitle>
                            {pkg.description && (
                              <CardDescription className="mt-1">{pkg.description}</CardDescription>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${pkg.name.toLowerCase().replace(/\s+/g, '-')}.mudpack.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              title="Download"
                              data-testid={`button-download-package-${pkg.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePackageMutation.mutate(pkg.id)}
                              title="Delete"
                              data-testid={`button-delete-package-${pkg.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground mb-3">
                          {getItemsSummary(pkg)}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => installPackageMutation.mutate(pkg)}
                          disabled={installPackageMutation.isPending}
                          className="w-full"
                          data-testid={`button-install-package-${pkg.id}`}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Install to {profile.name}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export from Profile</CardTitle>
                  <CardDescription>
                    Package your triggers, aliases, and other items to share or backup.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.triggers}
                        onChange={(e) => setSelectedItems({ ...selectedItems, triggers: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Triggers ({(profile.triggers as any[])?.length || 0})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.aliases}
                        onChange={(e) => setSelectedItems({ ...selectedItems, aliases: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Aliases ({(profile.aliases as any[])?.length || 0})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.timers}
                        onChange={(e) => setSelectedItems({ ...selectedItems, timers: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Timers ({(profile.timers as any[])?.length || 0})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.keybindings}
                        onChange={(e) => setSelectedItems({ ...selectedItems, keybindings: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Keybindings ({(profile.keybindings as any[])?.length || 0})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.buttons}
                        onChange={(e) => setSelectedItems({ ...selectedItems, buttons: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Buttons ({(profile.buttons as any[])?.length || 0})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.classes}
                        onChange={(e) => setSelectedItems({ ...selectedItems, classes: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Classes ({(profile.classes as any[])?.length || 0})</span>
                    </label>
                  </div>

                  <Button
                    onClick={() => setExportDialogOpen(true)}
                    className="w-full"
                    data-testid="button-open-export-dialog"
                  >
                    <FileJson className="w-4 h-4 mr-2" />
                    Create Package
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Package</DialogTitle>
            <DialogDescription>
              Give your package a name and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Package Name</Label>
              <Input
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                placeholder="My Awesome Package"
                data-testid="input-package-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={exportDescription}
                onChange={(e) => setExportDescription(e.target.value)}
                placeholder="A collection of useful automation for..."
                className="min-h-[80px]"
                data-testid="input-package-description"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveToLibrary}
              disabled={createPackageMutation.isPending}
              data-testid="button-save-to-library"
            >
              Save to Library
            </Button>
            <Button
              onClick={handleExport}
              data-testid="button-export-download"
            >
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
