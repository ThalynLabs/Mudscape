import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Package, Upload, Download, Trash2, FolderOpen, Plus, FileJson, FileArchive, Share2, Globe } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseMudletPackage, getImportSummary } from "@/lib/mudlet-parser";
import { parseTinTinConfigWithSounds, getTinTinImportSummary } from "@/lib/tintin-parser";
import type { SoundpackFile } from "@shared/schema";
import { parseVipMudConfig, getVipMudImportSummary } from "@/lib/vipmud-parser";
import type { Profile, Package as PackageType, PackageContents } from "@shared/schema";

interface PackageManagerProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PackageManager({ profile, open, onOpenChange }: PackageManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mudletInputRef = useRef<HTMLInputElement>(null);
  const tintinInputRef = useRef<HTMLInputElement>(null);
  const vipmudInputRef = useRef<HTMLInputElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [mudletPreviewOpen, setMudletPreviewOpen] = useState(false);
  const [tintinPreviewOpen, setTintinPreviewOpen] = useState(false);
  const [vipmudPreviewOpen, setVipmudPreviewOpen] = useState(false);
  const [mudletImportData, setMudletImportData] = useState<{ name: string; contents: PackageContents } | null>(null);
  const [tintinImportData, setTintinImportData] = useState<{ name: string; contents: PackageContents; soundFiles: File[]; referencedSounds: string[] } | null>(null);
  const [tintinInstalling, setTintinInstalling] = useState(false);
  const [vipmudImportData, setVipmudImportData] = useState<{ name: string; contents: PackageContents } | null>(null);
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
    mutationFn: (pkg: { name: string; description?: string; version?: string; author?: string; contents: PackageContents; targetMud?: string }) => 
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

  const sharePackageMutation = useMutation({
    mutationFn: async ({ id, targetMud }: { id: number; targetMud?: string }) => {
      const res = await apiRequest('POST', `/api/packages/${id}/share`, { targetMud });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-packages'], exact: false });
      toast({ title: "Package shared", description: "Package is now available in the server repository" });
    },
    onError: (err: Error) => {
      toast({ title: "Share failed", description: err.message, variant: "destructive" });
    },
  });

  const unsharePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/packages/${id}/unshare`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-packages'], exact: false });
      toast({ title: "Package unshared", description: "Package removed from server repository" });
    },
    onError: (err: Error) => {
      toast({ title: "Unshare failed", description: err.message, variant: "destructive" });
    },
  });

  const installPackageMutation = useMutation({
    mutationFn: async (pkg: { id: number; contents: PackageContents | null }) => {
      const contents = (pkg.contents || {}) as PackageContents;
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

  const handleMudletImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await parseMudletPackage(file);
    
    if (!result.success || !result.contents) {
      toast({ 
        title: "Import failed", 
        description: result.error || "Could not parse Mudlet package",
        variant: "destructive" 
      });
    } else {
      setMudletImportData({
        name: result.name || file.name.replace(/\.(mpackage|zip|xml)$/i, ''),
        contents: result.contents,
      });
      setMudletPreviewOpen(true);
    }
    
    if (mudletInputRef.current) {
      mudletInputRef.current.value = '';
    }
  };

  const handleMudletSaveToLibrary = () => {
    if (!mudletImportData) return;
    
    createPackageMutation.mutate({
      name: mudletImportData.name,
      description: 'Imported from Mudlet package',
      version: "1.0.0",
      author: "",
      contents: mudletImportData.contents,
    });
    
    setMudletPreviewOpen(false);
    setMudletImportData(null);
  };

  const handleMudletInstallDirect = () => {
    if (!mudletImportData) return;
    
    installPackageMutation.mutate({
      id: 0,
      contents: mudletImportData.contents,
    });
    
    setMudletPreviewOpen(false);
    setMudletImportData(null);
  };

  const TINTIN_CONFIG_EXTENSIONS = new Set(['.tt', '.tin', '.tintin', '.txt', '.cfg']);
  const TINTIN_SOUND_EXTENSIONS = new Set(['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.aac', '.mid', '.midi']);

  const handleTintinImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const allFiles = Array.from(fileList);
    const configFiles: File[] = [];
    const soundFiles: File[] = [];

    for (const file of allFiles) {
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      if (TINTIN_CONFIG_EXTENSIONS.has(ext)) {
        configFiles.push(file);
      } else if (TINTIN_SOUND_EXTENSIONS.has(ext)) {
        soundFiles.push(file);
      }
    }

    if (configFiles.length === 0 && soundFiles.length === 0) {
      toast({
        title: "No supported files",
        description: "Select TinTin++ config files (.tt, .tin, .txt) and/or sound files (.wav, .mp3, .ogg, etc.)",
        variant: "destructive",
      });
      return;
    }

    try {
      const mergedContents: PackageContents = {
        triggers: [],
        aliases: [],
        timers: [],
        keybindings: [],
        buttons: [],
        classes: [],
      };
      const allReferencedSounds: string[] = [];

      for (const file of configFiles) {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        const result = parseTinTinConfigWithSounds(content);
        mergedContents.triggers!.push(...(result.contents.triggers || []));
        mergedContents.aliases!.push(...(result.contents.aliases || []));
        mergedContents.timers!.push(...(result.contents.timers || []));
        mergedContents.classes!.push(...(result.contents.classes || []));
        allReferencedSounds.push(...result.referencedSounds);
      }

      const firstName = configFiles.length > 0
        ? configFiles[0].name.replace(/\.(tt|tin|tintin|txt|cfg)$/i, '')
        : 'TinTin++ Import';

      setTintinImportData({
        name: firstName,
        contents: mergedContents,
        soundFiles,
        referencedSounds: Array.from(new Set(allReferencedSounds)),
      });
      setTintinPreviewOpen(true);
    } catch (err) {
      toast({
        title: "Import failed",
        description: "Could not parse TinTin++ config files",
        variant: "destructive",
      });
    }

    if (tintinInputRef.current) {
      tintinInputRef.current.value = '';
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleTintinSaveToLibrary = () => {
    if (!tintinImportData) return;
    
    createPackageMutation.mutate({
      name: tintinImportData.name,
      description: 'Imported from TinTin++ config',
      version: "1.0.0",
      author: "",
      contents: tintinImportData.contents,
    });
    
    setTintinPreviewOpen(false);
    setTintinImportData(null);
  };

  const handleTintinInstallDirect = async () => {
    if (!tintinImportData) return;
    setTintinInstalling(true);

    try {
      if (tintinImportData.soundFiles.length > 0) {
        const BATCH_SIZE_BYTES = 1.5 * 1024 * 1024;
        const BATCH_MAX_FILES = 50;
        const allSavedFiles: { name: string; filename: string }[] = [];
        let batch: { name: string; data: string }[] = [];
        let batchSize = 0;

        for (const file of tintinImportData.soundFiles) {
          const base64 = await readFileAsBase64(file);
          const fileSize = base64.length;

          if ((batchSize + fileSize > BATCH_SIZE_BYTES || batch.length >= BATCH_MAX_FILES) && batch.length > 0) {
            const res = await apiRequest('POST', '/api/sounds/upload', { files: batch });
            const data = await res.json();
            if (data.files) allSavedFiles.push(...data.files);
            batch = [];
            batchSize = 0;
          }
          batch.push({ name: file.name, data: base64 });
          batchSize += fileSize;
        }
        if (batch.length > 0) {
          const res = await apiRequest('POST', '/api/sounds/upload', { files: batch });
          const data = await res.json();
          if (data.files) allSavedFiles.push(...data.files);
        }

        if (allSavedFiles.length > 0) {
          const seenNames = new Set<string>();
          const soundpackFiles: SoundpackFile[] = allSavedFiles
            .filter(f => {
              const key = f.name.toLowerCase();
              if (seenNames.has(key)) return false;
              seenNames.add(key);
              return true;
            })
            .map(f => ({
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              name: f.name.replace(/\.[^.]+$/, ''),
              filename: f.filename,
              category: 'effect' as const,
              volume: 1,
              loop: false,
            }));

          const spRes = await apiRequest('POST', '/api/soundpacks', {
            name: `${tintinImportData.name} Sounds`,
            description: `Sound files from TinTin++ import`,
            files: soundpackFiles,
          });
          const newSoundpack = await spRes.json();

          await apiRequest('PUT', `/api/profiles/${profile.id}`, {
            activeSoundpackId: String(newSoundpack.id),
          });
          queryClient.invalidateQueries({ queryKey: ['/api/soundpacks'] });
          queryClient.invalidateQueries({ queryKey: ['/api/profiles', profile.id] });

          toast({
            title: "Soundpack created",
            description: `"${tintinImportData.name} Sounds" with ${soundpackFiles.length} sounds`,
          });
        }
      }

      installPackageMutation.mutate({
        id: 0,
        contents: tintinImportData.contents,
      });
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setTintinInstalling(false);
      setTintinPreviewOpen(false);
      setTintinImportData(null);
    }
  };

  const handleVipmudImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const contents = parseVipMudConfig(content);
        setVipmudImportData({
          name: file.name.replace(/\.(set|cfg)$/i, ''),
          contents,
        });
        setVipmudPreviewOpen(true);
      } catch (err) {
        toast({ 
          title: "Import failed", 
          description: "Could not parse VIPMud config file",
          variant: "destructive" 
        });
      }
    };
    reader.readAsText(file);
    
    if (vipmudInputRef.current) {
      vipmudInputRef.current.value = '';
    }
  };

  const handleVipmudSaveToLibrary = () => {
    if (!vipmudImportData) return;
    
    createPackageMutation.mutate({
      name: vipmudImportData.name,
      description: 'Imported from VIPMud config',
      version: "1.0.0",
      author: "",
      contents: vipmudImportData.contents,
    });
    
    setVipmudPreviewOpen(false);
    setVipmudImportData(null);
  };

  const handleVipmudInstallDirect = () => {
    if (!vipmudImportData) return;
    
    installPackageMutation.mutate({
      id: 0,
      contents: vipmudImportData.contents,
    });
    
    setVipmudPreviewOpen(false);
    setVipmudImportData(null);
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
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                    data-testid="button-import-package"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Mudscape
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.mudpack.json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => mudletInputRef.current?.click()}
                    className="flex-1"
                    data-testid="button-import-mudlet"
                  >
                    <FileArchive className="w-4 h-4 mr-2" />
                    Import Mudlet Package
                  </Button>
                  <input
                    ref={mudletInputRef}
                    type="file"
                    accept=".mpackage,.zip,.xml"
                    onChange={handleMudletImport}
                    className="hidden"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => tintinInputRef.current?.click()}
                    className="flex-1"
                    data-testid="button-import-tintin"
                  >
                    <FileArchive className="w-4 h-4 mr-2" />
                    Import TinTin++ (Scripts + Sounds)
                  </Button>
                  <input
                    ref={tintinInputRef}
                    type="file"
                    multiple
                    accept=".tt,.tin,.tintin,.txt,.cfg,.wav,.mp3,.ogg,.flac,.m4a,.aac,.mid,.midi"
                    onChange={handleTintinImport}
                    className="hidden"
                    data-testid="input-tintin-files"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => vipmudInputRef.current?.click()}
                    className="flex-1"
                    data-testid="button-import-vipmud"
                  >
                    <FileArchive className="w-4 h-4 mr-2" />
                    Import VIPMud
                  </Button>
                  <input
                    ref={vipmudInputRef}
                    type="file"
                    accept=".set,.cfg,.txt"
                    onChange={handleVipmudImport}
                    className="hidden"
                  />
                </div>
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
                            {pkg.isShared ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => unsharePackageMutation.mutate(pkg.id)}
                                title="Remove from server repository"
                                data-testid={`button-unshare-package-${pkg.id}`}
                              >
                                <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => sharePackageMutation.mutate({ id: pkg.id })}
                                title="Share to server repository"
                                data-testid={`button-share-package-${pkg.id}`}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            )}
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
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-xs text-muted-foreground">
                            {getItemsSummary(pkg)}
                          </p>
                          {pkg.isShared && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Shared</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => installPackageMutation.mutate({ id: pkg.id, contents: pkg.contents })}
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

      <Dialog open={mudletPreviewOpen} onOpenChange={setMudletPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileArchive className="w-5 h-5" />
              Import Mudlet Package
            </DialogTitle>
            <DialogDescription>
              Preview the contents before importing.
            </DialogDescription>
          </DialogHeader>
          {mudletImportData && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Package Name</Label>
                <p className="text-lg font-semibold">{mudletImportData.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Contents</Label>
                <p className="text-sm text-muted-foreground">
                  {getImportSummary(mudletImportData.contents)}
                </p>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="py-3 text-sm space-y-1">
                  {mudletImportData.contents.triggers?.length ? (
                    <p>{mudletImportData.contents.triggers.length} triggers</p>
                  ) : null}
                  {mudletImportData.contents.aliases?.length ? (
                    <p>{mudletImportData.contents.aliases.length} aliases</p>
                  ) : null}
                  {mudletImportData.contents.timers?.length ? (
                    <p>{mudletImportData.contents.timers.length} timers</p>
                  ) : null}
                  {mudletImportData.contents.keybindings?.length ? (
                    <p>{mudletImportData.contents.keybindings.length} keybindings</p>
                  ) : null}
                  {mudletImportData.contents.buttons?.length ? (
                    <p>{mudletImportData.contents.buttons.length} buttons</p>
                  ) : null}
                  {mudletImportData.contents.scripts?.length ? (
                    <p>{mudletImportData.contents.scripts.length} scripts</p>
                  ) : null}
                  {mudletImportData.contents.classes?.length ? (
                    <p>{mudletImportData.contents.classes.length} classes</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleMudletSaveToLibrary}
              disabled={createPackageMutation.isPending}
              data-testid="button-mudlet-save-library"
            >
              Save to Library
            </Button>
            <Button
              onClick={handleMudletInstallDirect}
              disabled={installPackageMutation.isPending}
              data-testid="button-mudlet-install-direct"
            >
              <Plus className="w-4 h-4 mr-2" />
              Install to {profile.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tintinPreviewOpen} onOpenChange={setTintinPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileArchive className="w-5 h-5" />
              Import TinTin++ Scripts {tintinImportData?.soundFiles.length ? '+ Sounds' : ''}
            </DialogTitle>
            <DialogDescription>
              Preview the contents before importing.
            </DialogDescription>
          </DialogHeader>
          {tintinImportData && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Import Name</Label>
                <p className="text-lg font-semibold">{tintinImportData.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Contents</Label>
                <p className="text-sm text-muted-foreground">
                  {getTinTinImportSummary(tintinImportData.contents, tintinImportData.soundFiles.length)}
                </p>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="py-3 text-sm space-y-1">
                  {tintinImportData.contents.triggers?.length ? (
                    <p>{tintinImportData.contents.triggers.length} triggers</p>
                  ) : null}
                  {tintinImportData.contents.aliases?.length ? (
                    <p>{tintinImportData.contents.aliases.length} aliases</p>
                  ) : null}
                  {tintinImportData.contents.timers?.length ? (
                    <p>{tintinImportData.contents.timers.length} timers</p>
                  ) : null}
                  {tintinImportData.contents.classes?.length ? (
                    <p>{tintinImportData.contents.classes.length} classes</p>
                  ) : null}
                  {tintinImportData.soundFiles.length > 0 && (
                    <p>{tintinImportData.soundFiles.length} sound files (will create soundpack)</p>
                  )}
                  {tintinImportData.referencedSounds.length > 0 && (
                    <p className="text-muted-foreground">{tintinImportData.referencedSounds.length} sound references in scripts (auto-converted to playSound)</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTintinSaveToLibrary}
              disabled={createPackageMutation.isPending || tintinInstalling}
              data-testid="button-tintin-save-library"
            >
              Save Scripts to Library
            </Button>
            <Button
              onClick={handleTintinInstallDirect}
              disabled={installPackageMutation.isPending || tintinInstalling}
              data-testid="button-tintin-install-direct"
            >
              {tintinInstalling ? (
                <>Importing...</>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Install to {profile.name}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={vipmudPreviewOpen} onOpenChange={setVipmudPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileArchive className="w-5 h-5" />
              Import VIPMud Config
            </DialogTitle>
            <DialogDescription>
              Preview the contents before importing.
            </DialogDescription>
          </DialogHeader>
          {vipmudImportData && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">File Name</Label>
                <p className="text-lg font-semibold">{vipmudImportData.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Contents</Label>
                <p className="text-sm text-muted-foreground">
                  {getVipMudImportSummary(vipmudImportData.contents)}
                </p>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="py-3 text-sm space-y-1">
                  {vipmudImportData.contents.triggers?.length ? (
                    <p>{vipmudImportData.contents.triggers.length} triggers</p>
                  ) : null}
                  {vipmudImportData.contents.aliases?.length ? (
                    <p>{vipmudImportData.contents.aliases.length} aliases</p>
                  ) : null}
                  {vipmudImportData.contents.keybindings?.length ? (
                    <p>{vipmudImportData.contents.keybindings.length} keybindings</p>
                  ) : null}
                  {vipmudImportData.contents.classes?.length ? (
                    <p>{vipmudImportData.contents.classes.length} classes</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleVipmudSaveToLibrary}
              disabled={createPackageMutation.isPending}
              data-testid="button-vipmud-save-library"
            >
              Save to Library
            </Button>
            <Button
              onClick={handleVipmudInstallDirect}
              disabled={installPackageMutation.isPending}
              data-testid="button-vipmud-install-direct"
            >
              <Plus className="w-4 h-4 mr-2" />
              Install to {profile.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
