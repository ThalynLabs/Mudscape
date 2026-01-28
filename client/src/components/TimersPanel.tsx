import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Clock, Play } from "lucide-react";
import type { Profile, MudTimer } from "@shared/schema";
import { useUpdateProfile } from "@/hooks/use-profiles";
import { nanoid } from 'nanoid';

interface TimersPanelProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimersPanel({ profile, open, onOpenChange }: TimersPanelProps) {
  const updateMutation = useUpdateProfile();
  const timers = (profile.timers as MudTimer[]) || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTimer, setNewTimer] = useState<Partial<MudTimer>>({
    name: '',
    interval: 1000,
    oneShot: false,
    script: '',
    active: true,
  });

  const saveTimers = (updatedTimers: MudTimer[]) => {
    updateMutation.mutate({
      id: profile.id,
      timers: updatedTimers,
    });
  };

  const addTimer = () => {
    if (!newTimer.name || !newTimer.script) return;
    
    const timer: MudTimer = {
      id: nanoid(),
      name: newTimer.name!,
      interval: newTimer.interval || 1000,
      oneShot: newTimer.oneShot || false,
      script: newTimer.script!,
      active: true,
    };
    
    saveTimers([...timers, timer]);
    setNewTimer({
      name: '',
      interval: 1000,
      oneShot: false,
      script: '',
      active: true,
    });
  };

  const updateTimer = (id: string, updates: Partial<MudTimer>) => {
    saveTimers(timers.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTimer = (id: string) => {
    saveTimers(timers.filter(t => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const toggleTimer = (id: string, active: boolean) => {
    updateTimer(id, { active });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] border-l border-border bg-card overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timers
          </SheetTitle>
          <SheetDescription>
            Run scripts on a schedule or after a delay.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Timer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    data-testid="input-timer-name"
                    value={newTimer.name}
                    onChange={(e) => setNewTimer({ ...newTimer, name: e.target.value })}
                    placeholder="e.g., Auto-heal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interval (ms)</Label>
                  <Input
                    data-testid="input-timer-interval"
                    type="number"
                    min={100}
                    value={newTimer.interval}
                    onChange={(e) => setNewTimer({ ...newTimer, interval: parseInt(e.target.value) || 1000 })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  data-testid="switch-timer-oneshot"
                  checked={newTimer.oneShot}
                  onCheckedChange={(checked) => setNewTimer({ ...newTimer, oneShot: checked })}
                />
                <Label>One-shot (fires once then disables)</Label>
              </div>
              <div className="space-y-2">
                <Label>Script (JavaScript)</Label>
                <Textarea
                  data-testid="textarea-timer-script"
                  value={newTimer.script}
                  onChange={(e) => setNewTimer({ ...newTimer, script: e.target.value })}
                  placeholder="send('heal me');"
                  className="font-mono text-sm"
                  rows={3}
                />
              </div>
              <Button 
                data-testid="button-add-timer"
                onClick={addTimer} 
                disabled={!newTimer.name || !newTimer.script}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Timer
              </Button>
            </CardContent>
          </Card>

          {timers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No timers configured yet.</p>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Active Timers ({timers.length})
              </h3>
              {timers.map((timer) => (
                <Card key={timer.id} className={!timer.active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Play className="w-4 h-4 text-primary" />
                          <span className="font-medium truncate">{timer.name}</span>
                          {timer.oneShot && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">once</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Every {timer.interval}ms
                        </p>
                        <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-x-auto">
                          {timer.script.substring(0, 100)}{timer.script.length > 100 ? '...' : ''}
                        </pre>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          data-testid={`switch-timer-active-${timer.id}`}
                          checked={timer.active}
                          onCheckedChange={(checked) => toggleTimer(timer.id, checked)}
                        />
                        <Button
                          data-testid={`button-delete-timer-${timer.id}`}
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTimer(timer.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
