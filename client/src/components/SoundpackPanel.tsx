import { useState } from 'react';
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
import { Volume2, Plus, Trash2, Music, Play, Square } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { soundManager } from '@/lib/sound-manager';
import type { SoundpackRow, SoundpackFile } from '@shared/schema';

interface SoundpackPanelProps {
  activeSoundpackId?: string | null;
  onSelectSoundpack: (id: string | null) => void;
}

export function SoundpackPanel({ activeSoundpackId, onSelectSoundpack }: SoundpackPanelProps) {
  const [open, setOpen] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [masterVolume, setMasterVolume] = useState(100);
  const [playingSound, setPlayingSound] = useState<string | null>(null);

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

          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              {soundpacks.map((pack) => (
                <Card key={pack.id} className={activeSoundpackId === String(pack.id) ? 'border-primary' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        {pack.name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(pack.id)}
                        data-testid={`button-delete-soundpack-${pack.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {pack.files && pack.files.length > 0 ? (
                      <div className="space-y-1">
                        {pack.files.map((file) => (
                          <div 
                            key={file.id}
                            className="flex items-center justify-between py-1 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {file.category}
                              </Badge>
                              <span className="font-mono">{file.name}</span>
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
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No sounds. Upload audio files to add sounds.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {soundpacks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No soundpacks created. Create one to start adding sounds.
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>MSP Support:</strong> Sounds triggered by !!SOUND() and !!MUSIC()</p>
            <p><strong>Lua API:</strong> playSound("name"), loopSound("name"), stopSound("name")</p>
            <p><strong>Directional:</strong> setSoundPosition("name", x, y) for 3D audio</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
