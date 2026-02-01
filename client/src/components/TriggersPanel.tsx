import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Zap, Wand2 } from "lucide-react";
import { ScriptingWizard } from "@/components/ScriptingWizard";
import type { Profile, MudTrigger, MudClass } from "@shared/schema";
import { useUpdateProfile } from "@/hooks/use-profiles";
import { nanoid } from 'nanoid';

interface TriggersPanelProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TriggersPanel({ profile, open, onOpenChange }: TriggersPanelProps) {
  const updateMutation = useUpdateProfile();
  const triggers = (profile.triggers as MudTrigger[]) || [];
  const classes = (profile.classes as MudClass[]) || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTarget, setWizardTarget] = useState<'new' | string>('new');
  const [newTrigger, setNewTrigger] = useState<Partial<MudTrigger>>({
    pattern: '',
    type: 'regex',
    script: '',
    active: true,
  });

  const saveTriggers = (updatedTriggers: MudTrigger[]) => {
    updateMutation.mutate({
      id: profile.id,
      triggers: updatedTriggers,
    });
  };

  const addTrigger = () => {
    if (!newTrigger.pattern || !newTrigger.script) return;
    
    const trigger: MudTrigger = {
      id: nanoid(),
      pattern: newTrigger.pattern!,
      type: newTrigger.type || 'regex',
      script: newTrigger.script!,
      classId: newTrigger.classId,
      active: true,
      soundFile: newTrigger.soundFile,
      soundVolume: newTrigger.soundVolume,
      soundLoop: newTrigger.soundLoop,
    };
    
    saveTriggers([...triggers, trigger]);
    setNewTrigger({
      pattern: '',
      type: 'regex',
      script: '',
      active: true,
    });
  };

  const updateTrigger = (id: string, updates: Partial<MudTrigger>) => {
    saveTriggers(triggers.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTrigger = (id: string) => {
    saveTriggers(triggers.filter(t => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const toggleTrigger = (id: string, active: boolean) => {
    updateTrigger(id, { active });
  };

  const openWizardFor = (target: 'new' | string) => {
    setWizardTarget(target);
    setWizardOpen(true);
  };

  const handleWizardInsert = (script: string) => {
    if (wizardTarget === 'new') {
      setNewTrigger({ ...newTrigger, script });
    } else {
      updateTrigger(wizardTarget, { script });
    }
    setWizardOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] border-l border-border bg-card overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Triggers
          </SheetTitle>
          <SheetDescription>
            Run scripts when text patterns appear from the MUD.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Trigger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pattern</Label>
                <Input
                  data-testid="input-trigger-pattern"
                  value={newTrigger.pattern}
                  onChange={(e) => setNewTrigger({ ...newTrigger, pattern: e.target.value })}
                  placeholder="^You have (\d+) health points"
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newTrigger.type}
                    onValueChange={(val) => setNewTrigger({ ...newTrigger, type: val as 'regex' | 'plain' })}
                  >
                    <SelectTrigger data-testid="select-trigger-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regex">Regex</SelectItem>
                      <SelectItem value="plain">Plain Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Class (optional)</Label>
                  <Select
                    value={newTrigger.classId || '__none__'}
                    onValueChange={(val) => setNewTrigger({ ...newTrigger, classId: val === '__none__' ? undefined : val })}
                  >
                    <SelectTrigger data-testid="select-trigger-class">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Lua Script</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openWizardFor('new')}
                    className="h-7 text-xs"
                    data-testid="button-trigger-wizard-new"
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  data-testid="input-trigger-script"
                  value={newTrigger.script}
                  onChange={(e) => setNewTrigger({ ...newTrigger, script: e.target.value })}
                  placeholder="-- Access captured groups via matches[1], matches[2], etc.&#10;local health = tonumber(matches[1])&#10;if health < 100 then send('heal') end"
                  className="font-mono text-sm min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Sound (optional)</Label>
                  <Input
                    value={newTrigger.soundFile || ''}
                    onChange={(e) => setNewTrigger({ ...newTrigger, soundFile: e.target.value })}
                    placeholder="alert"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Volume</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={(newTrigger.soundVolume || 1) * 100}
                    onChange={(e) => setNewTrigger({ ...newTrigger, soundVolume: parseInt(e.target.value) / 100 })}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newTrigger.soundLoop || false}
                      onCheckedChange={(val) => setNewTrigger({ ...newTrigger, soundLoop: val })}
                    />
                    <Label className="text-xs">Loop</Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={addTrigger}
                disabled={!newTrigger.pattern || !newTrigger.script}
                className="w-full"
                data-testid="button-add-trigger"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Trigger
              </Button>
            </CardContent>
          </Card>

          {triggers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Existing Triggers ({triggers.length})
              </h3>
              
              {triggers.map((trigger) => (
                <Card key={trigger.id} className={!trigger.active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    {editingId === trigger.id ? (
                      <div className="space-y-3">
                        <Input
                          value={trigger.pattern}
                          onChange={(e) => updateTrigger(trigger.id, { pattern: e.target.value })}
                          className="font-mono text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={trigger.type}
                            onValueChange={(val) => updateTrigger(trigger.id, { type: val as 'regex' | 'plain' })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regex">Regex</SelectItem>
                              <SelectItem value="plain">Plain Text</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={trigger.classId || '__none__'}
                            onValueChange={(val) => updateTrigger(trigger.id, { classId: val === '__none__' ? undefined : val })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No Class" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">None</SelectItem>
                              {classes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Script</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openWizardFor(trigger.id)}
                            className="h-6 text-xs"
                          >
                            <Wand2 className="w-3 h-3 mr-1" />
                            AI
                          </Button>
                        </div>
                        <Textarea
                          value={trigger.script}
                          onChange={(e) => updateTrigger(trigger.id, { script: e.target.value })}
                          className="font-mono text-sm min-h-[80px]"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Done
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setEditingId(trigger.id)}
                        >
                          <div className="font-mono text-sm text-primary truncate">
                            {trigger.pattern}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {trigger.type} {trigger.classId && `• ${classes.find(c => c.id === trigger.classId)?.name}`}
                            {trigger.soundFile && ` • Sound: ${trigger.soundFile}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={trigger.active}
                            onCheckedChange={(val) => toggleTrigger(trigger.id, val)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTrigger(trigger.id)}
                            data-testid={`button-delete-trigger-${trigger.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>

      <ScriptingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        context="trigger"
        onInsert={handleWizardInsert}
      />
    </Sheet>
  );
}
