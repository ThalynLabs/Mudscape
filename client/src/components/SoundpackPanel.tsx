import type { ChangeEvent } from 'react';
import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Volume2, Plus, Trash2, Music, Play, Square, Upload, FolderOpen, Loader2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { soundManager } from '@/lib/sound-manager';
import { useToast } from '@/hooks/use-toast';
import type { SoundpackRow, SoundpackFile } from '@shared/schema';

const ALLOWED_EXTENSIONS = new Set(['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.aac', '.mid', '.midi']);
const BATCH_SIZE_BYTES = 1.5 * 1024 * 1024;
const BATCH_MAX_FILES = 50;

interface SoundpackPanelProps {
  activeSoundpackId?: string | null;
  onSelectSoundpack: (id: string | null) => void;
}

export function SoundpackPanel({ activeSoundpackId, onSelectSoundpack }: SoundpackPanelProps) {
  const [open, setOpen] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [masterVolume, setMasterVolume] = useState(100);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, label: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetPackId = useRef<number | null>(null);
  const { toast } = useToast();

  const { data: soundpacks = [] } = useQuery<SoundpackRow[]>({
    queryKey: ['/api/soundpacks'],
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest('POST', '/api/soundpacks', { name, files: [] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/soundpacks'] });
      setNewPackName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/soundpacks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/soundpacks'] });
    },
  });

  const handleCreate = () => {
    if (!newPackName.trim()) return;
    createMutation.mutate(newPackName.trim());
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setMasterVolume(vol);
    soundManager.setMasterVolume(vol / 100);
  };

  const handleTestSound = (soundpack: SoundpackRow, file: SoundpackFile) => {
    if (playingSound === file.id) {
      soundManager.stop(file.name);
      setPlayingSound(null);
    } else {
      soundManager.play(file.name, file.volume, false);
      setPlayingSound(file.id);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadToSoundpack = (packId: number) => {
    uploadTargetPackId.current = packId;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleCreateAndUpload = () => {
    uploadTargetPackId.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const validFiles = Array.from(fileList).filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return ALLOWED_EXTENSIONS.has(ext);
    });

    if (validFiles.length === 0) {
      toast({
        title: "No supported audio files",
        description: "Supported formats: WAV, MP3, OGG, FLAC, M4A, AAC, MIDI",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: validFiles.length, label: 'Reading files...' });

    try {
      const fileData: { name: string; data: string }[] = [];
      for (let i = 0; i < validFiles.length; i++) {
        setUploadProgress({ current: i, total: validFiles.length, label: `Reading ${validFiles[i].name}...` });
        const base64 = await readFileAsBase64(validFiles[i]);
        fileData.push({ name: validFiles[i].name, data: base64 });
      }

      const allSavedFiles: { name: string; filename: string }[] = [];
      let batchNum = 0;
      let batch: typeof fileData = [];
      let batchSize = 0;
      let uploadedCount = 0;

      const uploadBatch = async (files: typeof fileData) => {
        batchNum++;
        setUploadProgress({
          current: uploadedCount,
          total: validFiles.length,
          label: `Uploading batch ${batchNum} (${files.length} files)...`,
        });
        const res = await apiRequest('POST', '/api/sounds/upload', { files });
        const data = await res.json();
        if (data.files) {
          allSavedFiles.push(...data.files);
          uploadedCount += data.files.length;
        }
      };

      for (const fd of fileData) {
        const fileSize = fd.data.length;
        if ((batchSize + fileSize > BATCH_SIZE_BYTES || batch.length >= BATCH_MAX_FILES) && batch.length > 0) {
          await uploadBatch(batch);
          batch = [];
          batchSize = 0;
        }
        batch.push(fd);
        batchSize += fileSize;
      }
      if (batch.length > 0) {
        await uploadBatch(batch);
      }

      if (allSavedFiles.length === 0) {
        toast({ title: "Upload failed", description: "No files were saved", variant: "destructive" });
        setUploading(false);
        return;
      }

      setUploadProgress({ current: validFiles.length, total: validFiles.length, label: 'Creating soundpack...' });

      const seenNames = new Set<string>();
      const newSoundpackFiles: SoundpackFile[] = allSavedFiles
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

      let targetPackId = uploadTargetPackId.current;

      if (targetPackId) {
        const existingPack = soundpacks.find(p => p.id === targetPackId);
        if (existingPack) {
          const mergedFiles = [...(existingPack.files || []), ...newSoundpackFiles];
          await apiRequest('PUT', `/api/soundpacks/${targetPackId}`, { files: mergedFiles });
          toast({
            title: "Sounds uploaded",
            description: `Added ${newSoundpackFiles.length} sounds to "${existingPack.name}"`,
          });
        }
      } else {
        const packName = newPackName.trim() || `Soundpack ${new Date().toLocaleDateString()}`;
        const res = await apiRequest('POST', '/api/soundpacks', {
          name: packName,
          files: newSoundpackFiles,
        });
        const newPack = await res.json();
        targetPackId = newPack.id;
        onSelectSoundpack(String(newPack.id));
        setNewPackName('');
        toast({
          title: "Soundpack created",
          description: `"${packName}" with ${newSoundpackFiles.length} sounds`,
        });
      }

      soundManager.preloadSoundpack(newSoundpackFiles);
      queryClient.invalidateQueries({ queryKey: ['/api/soundpacks'] });

    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0, label: '' });
    }
  };

  const activeSoundpack = soundpacks.find(s => String(s.id) === activeSoundpackId);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-soundpack-panel">
          <Volume2 className="w-4 h-4 mr-2" />
          Sounds
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Soundpacks
          </SheetTitle>
        </SheetHeader>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".wav,.mp3,.ogg,.flac,.m4a,.aac,.mid,.midi"
          onChange={handleFilesSelected}
          className="hidden"
          data-testid="input-sound-files"
        />

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label>Master Volume</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[masterVolume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="w-12 text-right text-sm text-muted-foreground">{masterVolume}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Active Soundpack</Label>
            <Select 
              value={activeSoundpackId ?? 'none'} 
              onValueChange={(v) => onSelectSoundpack(v === 'none' ? null : v)}
            >
              <SelectTrigger data-testid="select-active-soundpack">
                <SelectValue placeholder="Select soundpack" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {soundpacks.map((pack) => (
                  <SelectItem key={pack.id} value={String(pack.id)}>
                    {pack.name} ({pack.files?.length ?? 0} sounds)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="New soundpack name"
              value={newPackName}
              onChange={(e) => setNewPackName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              data-testid="input-soundpack-name"
            />
            <Button 
              size="icon" 
              onClick={handleCreate}
              disabled={createMutation.isPending}
              data-testid="button-create-soundpack"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleCreateAndUpload}
            disabled={uploading}
            data-testid="button-upload-soundpack"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FolderOpen className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Uploading...' : 'Upload Sound Files (New Soundpack)'}
          </Button>

          {uploading && uploadProgress.total > 0 && (
            <div className="space-y-2">
              <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
              <p className="text-xs text-muted-foreground">{uploadProgress.label}</p>
            </div>
          )}

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {soundpacks.map((pack) => (
                <Card key={pack.id} className={activeSoundpackId === String(pack.id) ? 'border-primary' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        {pack.name}
                      </CardTitle>
                      <div className="flex items-center gap-1" style={{ visibility: 'visible' }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUploadToSoundpack(pack.id)}
                          disabled={uploading}
                          data-testid={`button-upload-to-soundpack-${pack.id}`}
                          title="Add sound files"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(pack.id)}
                          data-testid={`button-delete-soundpack-${pack.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {pack.files && pack.files.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-2">{pack.files.length} sounds</p>
                        {pack.files.slice(0, 20).map((file) => (
                          <div 
                            key={file.id}
                            className="flex items-center justify-between gap-1 py-1 text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="secondary" className="text-xs">
                                {file.category}
                              </Badge>
                              <span className="font-mono truncate">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTestSound(pack, file)}
                            >
                              {playingSound === file.id ? (
                                <Square className="w-3 h-3" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        ))}
                        {pack.files.length > 20 && (
                          <p className="text-xs text-muted-foreground pt-1">
                            ...and {pack.files.length - 20} more sounds
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No sounds yet. Click the upload icon to add audio files.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {soundpacks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No soundpacks yet. Upload sound files above or create an empty one.
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Formats:</strong> WAV, MP3, OGG, FLAC, M4A, AAC, MIDI</p>
            <p><strong>MSP Support:</strong> Sounds triggered by !!SOUND() and !!MUSIC()</p>
            <p><strong>Lua API:</strong> playSound("name"), loopSound("name"), stopSound("name")</p>
            <p><strong>Directional:</strong> setSoundPosition("name", x, y) for 3D audio</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
